const request = require('request');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const Web3 = require('web3');
const fs = require('fs');

const { txidToTxref } = require('../utils/tx-ref');
const {
  BTC_DUST,
  ETH_DID_CREATE,
  ETH_DID_UPDATE,
  ETH_DID_TRANSFER,
  ETH_DID_DELETE,
} = require('../utils/constants');

const client = exports;

const web3 = new Web3();

/**
 * Function to make HTTP calls.
 * @param {Object}
 * @returns {Object}
 */
client.call = ({ url, method, params }) => {
  const req = {
    url,
    method,
    body: params,
    json: true,
  };
  return new Promise((resolve, reject) => {
    request(req, (err, httpResponse, resp) => {
      if (err) {
        reject(err);
      }
      if (resp && resp.result) {
        resolve(resp);
      } else {
        reject(JSON.stringify(resp));
      }
    });
  });
};

client.upload = ({ url, path }) => new Promise((resolve, reject) => {
  const r = request.post(url, (err, httpResponse, resp) => {
    if (err) {
      reject(err);
    }
    const respParsed = JSON.parse(resp);
    if (respParsed && respParsed.cid) {
      resolve(respParsed);
    } else {
      reject(respParsed && respParsed.error);
    }
  });
  const form = r.form();
  form.append('file', fs.createReadStream(path));
});

client.get = ({ url }) => {
  const req = {
    url,
    method: 'GET',
    json: true,
  };
  return new Promise((resolve, reject) => {
    request(req, (err, httpResponse, resp) => {
      if (err) {
        reject(err);
      }
      if (resp) {
        resolve(resp);
      } else {
        reject(resp);
      }
    });
  });
};

/**
 * Method to store DidDoc on IPFS.
 * @param {string} didDocPath
 * @returns {Object}
 */
client.storeDidDoc = async (didDocPath, mdipUrl) => {
  try {
    const response = await client.upload({
      url: `${mdipUrl}/storeDoc`,
      path: didDocPath,
    });
    return response;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Method to create a raw transaction for DID creation.
 * @param {string} mdipUrl
 * @param {Object} didInputs
 * @param {Object} utxoData
 * @returns {string} rawTx The unsigned raw transaction.
 */
client.prepareTransaction = async (mdipUrl, didInputs, utxoData) => {
  try {
    const {
      blockchain,
      network,
      didCreator: creator,
      didUpdater: updater,
    } = didInputs;
    if (blockchain === 'btc') {
      const { unspents, fee } = utxoData;
      let totalAmount = 0;
      const sendAmt = BTC_DUST;
      const nw = network === 'testnet'
        ? bitcoin.networks.testnet
        : bitcoin.networks.bitcoin;
      const psbt = new bitcoin.Psbt({ network: nw });
      for (let i = 0; i < unspents.length; i++) {
        const {
          txid, vout, amount, rawTx: { hex },
        } = unspents[i];
        totalAmount += amount;
        psbt.addInput({
          hash: txid,
          index: vout,
          nonWitnessUtxo: Buffer.from(hex, 'hex'),
        });
      }
      psbt.addOutput({
        address: updater,
        value: parseInt(sendAmt * 10 ** 8, 10),
      });
      const change = parseInt(
        (totalAmount - (sendAmt + Number(fee))) * 10 ** 8,
        10,
      );
      if (change > 0) {
        psbt.addOutput({
          address: creator,
          value: change,
        });
      }
      return psbt;
    }
    if (blockchain === 'eth') {
      const didDoc = 'QmTgYsbD13fL2upHXZRwrDUbXUEArVDJe81RmdqgKeCedW';
      const type = ETH_DID_CREATE;
      const rawTx = await client.call({
        url: `${mdipUrl}/prepareTransaction`,
        method: 'POST',
        params: {
          blockchain, type, didDoc, publicKey: creator,
        },
      });
      return rawTx;
    }
    return null;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Method to fetch utxos and associated raw transactions.
 * @param {string} mdipUrl
 * @param {string} blockchain
 * @param {string} network
 * @param {string} addr
 * @returns {Object}
 */
client.getUtxos = async (mdipUrl, blockchain, network, creator) => {
  try {
    if (blockchain === 'btc') {
      const didTxnObject = await client.call({
        url: `${mdipUrl}/getutxos`,
        method: 'POST',
        params: { address: creator },
      });
      return didTxnObject.result;
    }
    return null;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Create a new MDIP DID.
 * @param {string} blockchain
 * @param {string} network
 * @param {string} tx
 * @returns {string}
 */
client.createNewMdipDID = async (blockchain, network, tx, mdipUrl) => {
  if (blockchain === 'btc') {
    // undefined is unavoidable for now due to the tx encoding logic
    const txRef = await txidToTxref(tx, network, undefined, mdipUrl);
    const extractedRef = txRef.split(':')[1];
    return `did:mdip:btc-${extractedRef}`;
  }
  if (blockchain === 'eth') {
    const event = await web3.eth.abi.decodeLog(
      [
        {
          indexed: false,
          name: 'id',
          type: 'bytes32',
        },
        {
          indexed: false,
          name: 'metadata',
          type: 'bytes32',
        },
      ],
      tx.logs[0].data,
      tx.logs[0].topics,
    );
    const extractedRef = event.id;
    return `did:mdip:eth-${extractedRef}`;
  }
  return null;
};

/**
 * Method to issue a new Verifiable Claim.
 * @param {{
 *  mdipURL: string
 *  blockchain: string
 *  attestorDID: string
 *  requestorDID: string
 *  claimType: string
 *  claimData: Object
 *  attestorName: string
 *  attestorPublicKey: string
 *  attestorPrivateKey: string
 * }} param0
 * @returns {Object}
 */
client.issueNewClaim = async ({
  mdipURL,
  blockchain,
  attestorDID,
  requestorDID,
  claimType,
  claimData,
  attestorName,
  attestorPublicKey,
  attestorPrivateKey,
}) => {
  if (blockchain === 'btc' || blockchain === 'eth') {
    const issuedClaim = await client.call({
      url: `${mdipURL}/issueNewClaim`,
      method: 'POST',
      params: {
        attestorDID,
        requestorDID,
        claimType,
        claimData,
        attestorName,
        attestorPublicKey,
        attestorPrivateKey,
        blockchain,
      },
    });
    return issuedClaim;
  }
  return null;
};

/**
 * Method to update MDIP ETH DID doc.
 * @param {string} did
 * @param {string} didDoc
 * @param {string} publicKey
 * @param {string} privateKey
 * @param {Object} didInputs
 * @param {string} mdipUrl
 * @returns {Object|string}
 */
client.updateDIDdoc = async (did, didDoc, publicKey, privateKey, didInputs, mdipUrl) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = did.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const cid = part3.substr(4, part3.length);
      const type = ETH_DID_UPDATE;
      const rawTx = await client.call({
        url: `${mdipUrl}/prepareTransaction`,
        method: 'POST',
        params: {
          blockchain, type, didDoc, publicKey, cid,
        },
      });
      let signedTx = await client.signTx(privateKey, rawTx, publicKey);
      signedTx = signedTx.data;
      const sentTx = await client.call({
        url: `${mdipUrl}/broadcast`,
        method: 'POST',
        params: { signedTx, blockchain },
      });
      return sentTx.result;
    }
    return null;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Method to update MDIP ETH DID Owner.
 * @param {string} did
 * @param {string} publicKey
 * @param {string} privateKey
 * @param {string} newOwner
 * @param {Object} didInputs
 * @param {string} mdipUrl
 * @returns {Object|string}
 */
client.updateDIDowner = async (did, publicKey, privateKey, newOwner, didInputs, mdipUrl) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = did.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const cid = part3.substr(4, part3.length);
      const type = ETH_DID_TRANSFER;
      const rawTx = await client.call({
        url: `${mdipUrl}/prepareTransaction`,
        method: 'POST',
        params: {
          blockchain, type, publicKey, newOwner, cid,
        },
      });

      let signedTx = await client.signTx(privateKey, rawTx, publicKey);
      signedTx = signedTx.data;
      const sentTx = await client.call({
        url: `${mdipUrl}/broadcast`,
        method: 'POST',
        params: { signedTx, blockchain },
      });
      return sentTx.result;
    }
    return null;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Delete MDIP ETH DID doc.
 * @param {string} did
 * @param {string} publicKey
 * @param {string} privateKey
 * @param {Object} didInputs
 * @param {string} mdipUrl
 * @returns {Object|string}
 */
client.deleteDID = async (did, publicKey, privateKey, didInputs, mdipUrl) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = did.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const cid = part3.substr(4, part3.length);
      const type = ETH_DID_DELETE;
      const rawTx = await client.call({
        url: `${mdipUrl}/prepareTransaction`,
        method: 'POST',
        params: {
          blockchain, type, publicKey, cid,
        },
      });

      let signedTx = await client.signTx(privateKey, rawTx, publicKey);
      signedTx = signedTx.data;
      const sentTx = await client.call({
        url: `${mdipUrl}/broadcast`,
        method: 'POST',
        params: { signedTx, blockchain },
      });
      return sentTx.result;
    }
    return null;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Read MDIP ETH DID doc.
 * @param {string} didMDIP
 * @param {string} publicKey
 * @param {Object} didInputs
 * @param {string} mdipUrl
 * @returns {Object}
 */
client.readDID = async (didMDIP, publicKey, didInputs, mdipUrl) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = didMDIP.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const did = part3.substr(4, part3.length);
      const network = blockchain;
      const didURL = await client.call({
        url: `${mdipUrl}/readDID`,
        method: 'POST',
        params: {
          network, did, publicKey,
        },
      });
      const didDoc = await client.get({
        url: `${didURL.result}`,
      });
      return didDoc;
    }
    return null;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Method to create a new verifiable presentation.
 * @param {string} blockchain
 * @param {string} vc
 * @param {string} publicKey
 * @param {string} privateKey
 * @param {string} challenge
 * @param {string} domain
 * @param {string} givenNetwork
 * @param {Object} randomBytes
 * @returns {Object}
 */
client.createVerifiablePresentation = async (
  blockchain,
  vc,
  publicKey,
  privateKey,
  challenge,
  domain,
  givenNetwork,
  randomBytes,
) => {
  const parsedVC = JSON.parse(vc);
  const vp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: 'VerifiablePresentation',
    verifiableCredential: [parsedVC],
  };
  const message = JSON.stringify(vp);
  let signature = null;
  if (blockchain === 'btc') {
    let network = bitcoin.networks.testnet;
    if (givenNetwork === 'mainnet') {
      network = bitcoin.networks.bitcoin;
    }
    const keyPair = bitcoin.ECPair.fromWIF(privateKey, network);
    const obatinedPrivKey = keyPair.privateKey;
    signature = bitcoinMessage.sign(
      message,
      obatinedPrivKey,
      keyPair.compressed,
      { extraEntropy: randomBytes(32) },
    );
  }
  if (blockchain === 'eth') {
    // const intmdSign = (await web3.eth.accounts.sign(message, `0x${privateKey}`)).signature;
    // signature = Buffer.from(intmdSign);
    signature = (await web3.eth.accounts.sign(message, `0x${privateKey}`)).signature;
  }
  if (signature) {
    const createdAt = new Date().toISOString();
    vp.proof = {
      type: 'EcdsaSecp256k1VerificationKey2019',
      created: createdAt,
      proofPurpose: 'authentication',
      verificationMethod: publicKey, // TODO: use DID fragments to point to the public key.
      challenge,
      domain,
      jws: signature.toString('base64'),
    };
    return vp;
  }
  return null;
};

/**
 * Method to broadcast an already signed transaction.
 * @param {string} mdipUrl
 * @param {string} signedTx
 * @param {string} blockchain
 * @returns {string}
 */
client.broadcast = async (mdipUrl, signedTx, blockchain) => {
  const sentTx = await client.call({
    url: `${mdipUrl}/broadcast`,
    method: 'POST',
    params: { signedTx, blockchain },
  });
  return sentTx.result;
};

/**
 * Method to sign an ETH transaction.
 * @param {string} privKey
 * @param {string} rawTx
 * @param {string} pubKey
 * @param {{
 *  blockchain: string
 *  network: string
 * }} param0
 * @returns {Object}
 */
client.signTx = async (privKey, rawTx, pubKey, { blockchain, network } = {}) => {
  try {
    if (blockchain === 'btc') {
      const nw = network === 'testnet'
        ? bitcoin.networks.testnet
        : bitcoin.networks.bitcoin;
      const signer = bitcoin.ECPair.fromWIF(privKey, nw);
      rawTx.signAllInputs(signer);
      const valid = rawTx.validateSignaturesOfAllInputs();
      if (valid) {
        rawTx.finalizeAllInputs();
        const txHex = rawTx.extractTransaction().toHex();
        return { success: true, data: txHex };
      }
    } else {
      const web3Instance = new Web3(
        new Web3.providers.HttpProvider(rawTx.result.provider),
      );
      web3Instance.eth.accounts.wallet.add(privKey);
      const tx = await web3Instance.eth.accounts.signTransaction(
        {
          from: pubKey,
          gasPrice: rawTx.result.gasPrice,
          gas: rawTx.result.gasLimit,
          to: rawTx.result.contractAddress,
          data: rawTx.result.data,
        },
        privKey,
      );
      web3Instance.eth.accounts.wallet.clear();
      return { success: true, data: tx };
    }
    return null;
  } catch (err) {
    return { success: false, data: `${err}` };
  }
};
