const express = require('express');
const bodyParser = require('body-parser');
// const jsonld = require('jsonld');
// const jws = require('jws');
const bitcoin = require('bitcoinjs-lib'); // v4.x.x
const bitcoinMessage = require('bitcoinjs-message');
const { randomBytes } = require('crypto');

const Web3 = require('web3');
const { uptime } = require('./node');
const { mainnet } = require('../protocol/networks');
const { btcClient, helpers } = require('../utils/clients');
const i18n = require('../../i18n');
const { credentialTypes } = require('../config');
const { txrefToTxid } = require('../client/utils/tx-ref');
const env = require('../ethDID/utils/env.json');
const utils = require('../ethDID/utils/utils.js');

const web3 = new Web3(new Web3.providers.HttpProvider(env.RopstenInfura));

const node = express();

node.use(bodyParser.json({ limit: '200kb' }));
node.use(bodyParser.urlencoded({ extended: true }));

/** Tx Chain parsing logic */
let txChainLevel = 1; // Level 0 is the utxo that is provided as input parameters!!. xD
let txChain = {};
/** This method returns the transaction that spent
 * a given utxo. And then the tx that spent this utxo and so on... */
async function parseBlocks(txid, vout, blockhash) {
  /** nextblockhash field will not be there if we are at the bestblock. */
  let txidBuf = txid;
  let voutBuf = vout;
  const { tx, nTx, nextblockhash } = (await btcClient('getblock', [blockhash, 2])).result; // 2(highest) signifies verbosity level of this command.
  // eslint-disable-next-line no-plusplus
  for (let x = 0; x < nTx; x++) {
    const { vin, vout: currVout, txid: currTxid } = tx[x];
    // eslint-disable-next-line no-plusplus
    for (let y = 0; y < vin.length; y++) {
      const { txid: vinTxid, vout: vinVout } = vin[y];
      if (vinTxid === txid && vinVout === vout) {
        let OP_RETURN = null;
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < currVout.length; i++) {
          const { asm, type } = currVout[i].scriptPubKey;
          if (type === 'nulldata') {
            [OP_RETURN] = asm.split('OP_RETURN ');
          }
        }
        if (!OP_RETURN) {
          throw new Error(`DID continuation doc not found at level ${txChainLevel}.`);
        }
        txidBuf = currTxid;
        voutBuf = currVout[0].n; // Assuming the new address is at 0 index only.
        tx[x].ddo = OP_RETURN;
        txChain[txChainLevel] = tx[x];
        txChainLevel += 1;
      }
    }
  }
  if (!nextblockhash) {
    const res = { ...txChain };
    res.final = res[txChainLevel - 1];
    txChain = {};
    txChainLevel = 1;
    return res;
  }
  return parseBlocks(txidBuf, voutBuf, nextblockhash);
}

async function getTxsChain(txid, vout) {
  try {
    await btcClient('gettxout', [txid, vout]);
    return {};
  } catch (errTxo) {
    const getRawTx = (await btcClient('getrawtransaction', [txid, true]))
      .result;
    const { blockhash } = getRawTx;
    return parseBlocks(txid, vout, blockhash);
  }
}

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
    const amount = 0.00001; // Update this magic number.
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

node.post('/sendSignedTx', async (req, res) => {
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
      const sentTx = await btcClient('sendrawtransaction', [signedTx.result.hex]);
      return res.status(200).send({
        error: null,
        message: 'Txn sent successfully.',
        result: sentTx.result,
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

node.post('/broadcast', async (req, res) => {
  try {
    const { signedTx, blockchain } = req.body;
    if (!signedTx) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    let sentTx; let sentTx2;
    if (blockchain == 'eth') {
      sentTx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
     // sentTx = await utils.EventlogParser(sentTx.logs, env.contractABI);

     
     console.log(sentTx);
    } else sentTx = await btcClient('sendrawtransaction', [signedTx]);

    return res.status(200).send({
      error: null,
      message: 'Txn sent successfully.',
      result: sentTx,
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
      blockchain,
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
    if (part1 !== 'did' || part2 !== 'mdip' || (part3.substr(0, 3) !== 'btc' && part3.substr(0, 3) !== 'eth')) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Invalid DID sent.') });
    }
    [part1, part2, part3] = requestorDID.split(':');
    if (part1 !== 'did' || part2 !== 'mdip' || (part3.substr(0, 3) !== 'btc' && part3.substr(0, 3) !== 'eth')) {
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
    const message = JSON.stringify(claim);
    let signature;
    if (blockchain === 'eth') {
      const web3 = new Web3(new Web3.providers.HttpProvider());
      signature = await web3.eth.accounts.sign(message, `0x${attestorPrivateKey}`);
    } else {
      let network = bitcoin.networks.testnet;
      if (givenNetwork === 'mainnet') {
        network = bitcoin.networks.bitcoin;
      }
      const keyPair = bitcoin.ECPair.fromWIF(attestorPrivateKey, network);
      const obatinedPrivKey = keyPair.privateKey;

      signature = bitcoinMessage.sign(
        message,
        obatinedPrivKey,
        keyPair.compressed,
        { extraEntropy: randomBytes(32) },
      );
    }

    claim.proof = {
      type: 'EcdsaSecp256k1VerificationKey2019',
      created: validFrom,
      proofPurpose: 'assertionMethod',
      verificationMethod: attestorPublicKey,
      // This will be more generic e.g: did:mdip:btc-1234#pubkey1 so that id does not get hardcoded.
      jws: signature.signature.toString('base64'), // TODOD: More research needed. Link: https://w3c-ccg.github.io/lds-ecdsa-secp256k1-2019/#examples-0
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

// eslint-disable-next-line consistent-return
node.post('/updateDID', async (req, res) => {
  try {
    const {
      did,
      didUpdaterKeypair: { address, privateKey },
      newReceiver,
      network,
      didDocURL,
    } = req.body;
    if (!did || !address || !privateKey || !newReceiver || !network || !didDocURL) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const txRef = did.split(':')[2].split('btc-')[1];
    const finalTxRef = network === 'mainnet' ? `tx1:${txRef}` : `txtest1:${txRef}`;
    const { txid, utxoIndex } = await txrefToTxid(finalTxRef);
    let txoCall;
    try {
      txoCall = await btcClient('gettxout', [txid, utxoIndex]);
    } catch (errTxo) {
      return res.status(400).send({
        error: true,
        message: 'DID already revoked.',
      });
    }
    const txo = txoCall.result;
    if (txo.scriptPubKey.addresses[0] !== address) {
      return res.status(400).send({
        error: null,
        message: 'Invalid DID updater key pair provided.',
      });
    }
    if (txo) {
      let inputs = [{ txid, vout: utxoIndex }];
      const fee = helpers.calculateFee(1, 1);
      let totalAmount = txo.value;
      if (totalAmount < fee) {
        const unspents = (
          await btcClient('listunspent', [
            1,
            9999999,
            [txo.scriptPubKey.addresses[0]],
          ])
        ).result;
        totalAmount = unspents.reduce((acc, u) => acc + u.amount, 0);
        if (totalAmount < fee) {
          return res.status(400).send({
            error: null,
            message: 'DID does not have funds to pay for update fee.',
          });
        }
        inputs = unspents.map((x) => ({ txid: x.txid, vout: x.vout }));
      }
      const outputs = { [newReceiver]: (totalAmount - fee).toFixed(8) };
      outputs.data = Buffer.from(didDocURL).toString('hex'); // OP_RETURN
      const rawTx = await btcClient('createrawtransaction', [inputs, outputs]);
      const signedTx = await btcClient('signrawtransactionwithkey', [
        rawTx.result,
        [privateKey],
      ]);
      if (signedTx.result && signedTx.result.complete) {
        const sentTx = await btcClient('sendrawtransaction', [
          signedTx.result.hex,
        ]);
        return res.status(400).send({
          error: null,
          message: `DID: ${did} updated successfully.`,
          result: sentTx,
        });
      }
      if (signedTx.result && !signedTx.result.complete) {
        return res.status(400).send({
          error: true,
          message: 'Invalid private key provided.',
        });
      }
    }
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

/**
 * Handle use-case: if there is no outpoint address except nulldata.
 */
// eslint-disable-next-line consistent-return
node.post('/deleteDID', async (req, res) => {
  try {
    const {
      did,
      didUpdaterKeypair: { address, privateKey },
      newReceiver,
      network,
    } = req.body;
    if (!did || !address || !privateKey || !newReceiver || !network) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const txRef = did.split(':')[2].split('btc-')[1];
    const finalTxRef = network === 'mainnet' ? `tx1:${txRef}` : `txtest1:${txRef}`;
    const { txid, utxoIndex } = await txrefToTxid(finalTxRef);
    let txoCall;
    try {
      txoCall = await btcClient('gettxout', [txid, utxoIndex]);
    } catch (errTxo) {
      return res.status(400).send({
        error: true,
        message: 'DID already revoked.',
      });
    }
    const txo = txoCall.result;
    if (txo.scriptPubKey.addresses[0] !== address) {
      return res.status(400).send({
        error: null,
        message: 'Invalid DID updater key pair provided.',
      });
    }
    if (txo) {
      let inputs = [{ txid, vout: utxoIndex }];
      const fee = helpers.calculateFee(1, 1);
      let totalAmount = txo.value;
      if (totalAmount < fee) {
        const unspents = (
          await btcClient('listunspent', [
            1,
            9999999,
            [txo.scriptPubKey.addresses[0]],
          ])
        ).result;
        totalAmount = unspents.reduce((acc, u) => acc + u.amount, 0);
        if (totalAmount < fee) {
          return res.status(400).send({
            error: null,
            message: 'DID does not have funds to pay for revoke fee.',
          });
        }
        inputs = unspents.map((x) => ({ txid: x.txid, vout: x.vout }));
      }
      /** TODO: validate newReceiver address. */
      const outputs = { [newReceiver]: (totalAmount - fee).toFixed(8) };
      const rawTx = await btcClient('createrawtransaction', [inputs, outputs]);
      const signedTx = await btcClient('signrawtransactionwithkey', [
        rawTx.result,
        [privateKey],
      ]);
      if (signedTx.result && signedTx.result.complete) {
        const sentTx = await btcClient('sendrawtransaction', [
          signedTx.result.hex,
        ]);
        return res.status(400).send({
          error: null,
          message: `DID: ${did} revoked successfully.`,
          result: sentTx,
        });
      }
      if (signedTx.result && !signedTx.result.complete) {
        return res.status(400).send({
          error: true,
          message: 'Invalid private key provided.',
        });
      }
    }
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

/**
 * Handle non-wallet addresses. if watch-only then handle rescan operation.
 * Add logic for spent outpoint and parsing further up the chain - expensive operation!
 * Handle multi-address inputs use-case: thorw error if that is encountered.
 * TODO: add -txindex flag in btcd.
 */
node.post('/readDID', async (req, res) => {
  try {
    const { did, network } = req.body;
    if (!did || !network) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const txRef = did.split(':')[2].split('btc-')[1];
    const finalTxRef = network === 'mainnet' ? `tx1:${txRef}` : `txtest1:${txRef}`;
    const { txid, utxoIndex } = await txrefToTxid(finalTxRef);
    const resp = await getTxsChain(txid, utxoIndex);
    if (Object.keys(resp).length) {
      const { final: { ddo } } = resp;
      const didDocURL = Buffer.from(ddo, 'hex').toString();
      return res.status(200).send({
        error: null,
        result: didDocURL,
        message: 'DID Document obtained successfully.',
      });
    }
    const { vin, vout } = (
      await btcClient('getrawtransaction', [txid, true])
    ).result;
    let OP_RETURN = null;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < vout.length; i++) {
      const { asm, type } = vout[i].scriptPubKey;
      if (type === 'nulldata') {
        [OP_RETURN] = asm.split('OP_RETURN ');
      }
    }
    if (OP_RETURN) {
      const document = Buffer.from(OP_RETURN, 'hex').toString();
      return res.status(200).send({
        error: null,
        result: document,
        message: 'DID Document obtained successfully.',
      });
    }
    /** TODO: there will be more than 1 input. add a check
     * that will throw when there are more than 1 diff addresses.
     */
    const { txid: iptxid, vout: ipvout } = vin[0];
    const iptxData = (await btcClient('getrawtransaction', [iptxid, true]))
      .result;
    const {
      scriptPubKey: { addresses },
    } = iptxData.vout[ipvout];
    const defaultCapability = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: `${did}`,
      publicKey: [
        {
          id: `${did}#auth`,
          controller: `${did}`,
          type: 'EcdsaSecp256k1VerificationKey2019',
          publicKeyBase58: addresses[0],
        },
        {
          id: `${did}#vc-pubkey`,
          controller: `${did}`,
          type: 'EcdsaSecp256k1VerificationKey2019',
          publicKeyBase58: addresses[0],
        },
      ],
      authentication: ['#auth'],
      assertionMethod: ['#vc-pubkey'],
    };
    return res.status(200).send({
      error: null,
      message: 'DID Doucment obtained successfully.',
      result: defaultCapability,
    });
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

node.post('/getutxos', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const { success, unspents, total_amount: totalAmount } = (
      await btcClient('scantxoutset', ['start', [{ desc: `addr(${address})` }]])
    ).result;
    const fee = await helpers.calculateFee(unspents.length, 3);
    if (success && totalAmount >= fee) {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < unspents.length; i++) {
        const { txid } = unspents[i];
        // eslint-disable-next-line no-await-in-loop
        const getTx = (await btcClient('getrawtransaction', [txid, true])).result;
        unspents[i].rawTx = getTx;
      }
      return res.status(200).send({
        error: null,
        message: 'Inputs obtained.',
        result: { unspents, fee },
      });
    }
    return res.status(200).send({
      error: true,
      message: 'Sender does not have funds.',
      result: null,
    });
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

const Node = exports;
node.use(express.urlencoded({ extended: true }));
node.use(express.json());

Node.start = () => {
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};
