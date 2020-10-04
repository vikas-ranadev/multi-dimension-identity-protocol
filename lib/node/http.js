const express = require('express');
const bodyParser = require('body-parser');
// const jsonld = require('jsonld');
// const jws = require('jws');
const bitcoin = require('bitcoinjs-lib'); // v4.x.x
const bitcoinMessage = require('bitcoinjs-message');
const { randomBytes } = require('crypto');

const { uptime } = require('./node');
const { mainnet } = require('../protocol/networks');
const { btcClient, helpers } = require('../utils/clients');
const i18n = require('../../i18n');
const { credentialTypes } = require('../config');
const { txrefToTxid } = require('../client/utils/tx-ref');

const node = express();

node.use(bodyParser.json({ limit: '200kb' }));
node.use(bodyParser.urlencoded({ extended: true }));

/**
 * Endpoint to check daemon's uptime.
 * @returns {object} "uptime" in milliseconds
 */
node.get('/getuptime', (req, res) => {
  res.status(200).send({ uptime: new Date().getTime() - uptime() });
});

node.post('/createDIDRawTx', async (req, res) => {
  const { didCreator, didUpdater } = req.body;
  if (!didCreator || !didUpdater) {
    return res
      .status(400)
      .send({ result: null, error: i18n('Missing parameters') });
  }
  try {
    const amount = 0.00000546; // Update this magic number.
    let fee = 0;
    // await btcClient('importaddress', [didCreator, '', false]);
    // await btcClient('importaddress', [didUpdater, '', false]);
    const unspents = (
      await btcClient('listunspent', [1, 9999999, [didCreator]])
    ).result;
    if (unspents.length) {
      const inputs = [];
      const outputs = {};
      fee = helpers.calculateFee(unspents.length, 3); // Update this magic number.
      let totalAmount = 0;
      unspents.forEach((x) => {
        inputs.push({ txid: x.txid, vout: x.vout });
        totalAmount += x.amount;
      });
      if (totalAmount >= Number(amount) + Number(fee)) {
        const changeAmt = (
          totalAmount - (Number(amount) + Number(fee))
        ).toFixed(8);
        outputs[didUpdater] = String(amount);
        if (Number(changeAmt) > 0) {
          outputs[didCreator] = changeAmt;
        }
        // outputs.data = OP_RETURN;
        const rawTx = await btcClient('createrawtransaction', [
          inputs,
          outputs,
        ]);
        if (rawTx.result) {
          return res.status(200).send({
            message: 'Tx created successfully.',
            result: rawTx.result,
            error: null,
          });
        }
        return res.status(500).send({
          result: null,
          error: i18n('Error occurred while creating a raw transaction.'),
        });
      }
      return res.status(500).send({
        result: null,
        error: i18n('Sender does not have sufficient balance.'),
      });
    }
    fee = helpers.calculateFee(1, 2); // Update this magic number.
    return res.status(500).send({
      result: null,
      error: i18n(
        `Sender does not have funds. Please fund this address "${didCreator}" with ${fee} BTC.`,
      ),
    });
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

node.post('/signTx', async (req, res) => {
  try {
    const { rawTx, privKey } = req.body;
    if (!rawTx || !privKey) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const signedTx = await btcClient('signrawtransactionwithkey', [
      rawTx,
      [privKey],
    ]);
    if (signedTx.result && signedTx.result.complete) {
      return res.status(400).send({
        result: signedTx.result.hex,
        message: 'Tx signed successfully.',
        error: null,
      });
    }
    return {
      result: null,
      error: i18n('Error in signing transaction'),
    };
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

node.post('/createNewDID', async (req, res) => {
  try {
    const { signedTx } = req.body;
    if (!signedTx) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const sentTx = await btcClient('sendrawtransaction', [signedTx]);
    return res.status(200).send({
      error: null,
      message: 'Txn sent successfully.',
      result: sentTx.result,
    });
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

node.post('/issueNewClaim', async (req, res) => {
  try {
    const {
      attestorDID,
      requestorDID,
      claimType,
      claimData,
      attestorPublicKey,
      attestorPrivateKey,
      network: givenNetwork,
    } = req.body;
    if (
      !attestorDID
      || !requestorDID
      || !claimType
      || !claimData
      || !attestorPublicKey
      || !attestorPrivateKey
    ) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    if (!credentialTypes.includes(claimType)) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Invalid claimType sent.') });
    }
    let [part1, part2, part3] = attestorDID.split(':');
    if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'btc') {
      return res
        .status(400)
        .send({ result: null, error: i18n('Invalid DID sent.') });
    }
    [part1, part2, part3] = requestorDID.split(':');
    if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'btc') {
      return res
        .status(400)
        .send({ result: null, error: i18n('Invalid DID sent.') });
    }
    let claim = {};
    const validFrom = new Date().toISOString();
    const validUntil = new Date(
      Date.now() + 180 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 6-months validity.
    if (
      (claimType === 'ageOver18' || claimType === 'ageOver21')
      && claimData[claimType]
    ) {
      claim = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: attestorDID,
        type: ['VerifiableCredential', claimType],
        issuer: {
          id: attestorDID,
          name: 'Facebook',
        },
        issuanceDate: validFrom,
        expirationDate: validUntil,
        credentialSubject: {
          id: requestorDID, // requester's DID
          [claimType]: true,
        },
      };
    }
    let network = bitcoin.networks.testnet;
    if (givenNetwork === 'mainnet') {
      network = bitcoin.networks.bitcoin;
    }
    const keyPair = bitcoin.ECPair.fromWIF(attestorPrivateKey, network);
    const obatinedPrivKey = keyPair.privateKey;
    const message = JSON.stringify(claim);
    const signature = bitcoinMessage.sign(
      message,
      obatinedPrivKey,
      keyPair.compressed,
      { extraEntropy: randomBytes(32) },
    );
    claim.proof = {
      type: 'EcdsaSecp256k1VerificationKey2019',
      created: validFrom,
      proofPurpose: 'assertionMethod',
      verificationMethod: attestorPublicKey,
      // This will be more generic e.g: did:mdip:btc-1234#pubkey1 so that id does not get hardcoded.
      jws: signature.toString('base64'), // TODOD: More research needed. Link: https://w3c-ccg.github.io/lds-ecdsa-secp256k1-2019/#examples-0
    };
    return res.status(200).send({
      error: null,
      message: 'Verifiable claim generated successfully.',
      result: JSON.stringify(claim),
    });
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

node.post('/deleteDID', async (req, res) => {
  console.log('request body', req.body);
  try {
    const {
      did,
      didUpdaterKeypair,
      newReceiver,
      network,
    } = req.body;
    if (!did || !didUpdaterKeypair || !newReceiver || !network) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const txRef = did.split(':')[2].split('btc-')[1];
    const finalTxRef = network === 'mainnet' ? `tx1:${txRef}` : `txtest1:${txRef}`;
    const { txid, utxoIndex } = await txrefToTxid(finalTxRef);
    const txo = await btcClient('gettxout', [txid, utxoIndex]);
    if (txo) {
      const getTx = await btcClient('gettransaction', [txid]);
      console.log('getTx', getTx, txo);
    }
    return res.status(400).send({
      error: null,
      message: 'DID already revoked.',
    });
  } catch (errorT) {
    console.log('[what is the error?]', errorT);
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

const Node = exports;

Node.start = () => {
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};
