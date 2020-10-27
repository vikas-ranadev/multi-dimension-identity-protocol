const request = require('request');
const bitcoin = require('bitcoinjs-lib'); // v4.x.x
const bitcoinMessage = require('bitcoinjs-message');
const { randomBytes } = require('crypto');

const { txidToTxref } = require('./utils/tx-ref');

const client = exports;

// client.connect = ({ url }) => {
//   return
// }

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
        reject(resp);
      }
    });
  });
};

/**
 * Method to create a raw transaction for DID creation.
 * @param {string} mdipUrl
 * @param {object} didInputs
 */
client.createDIDTx = async (mdipUrl, didInputs) => {
  try {
    const { blockchain } = didInputs;
    if (blockchain === 'btc') {
      const didTxnObject = await client.call({
        url: `${mdipUrl}/${'createDIDRawTx'}`,
        method: 'POST',
        params: didInputs,
      });
      return didTxnObject.result;
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
 */
client.getUtxos = async (mdipUrl, blockchain, network, creator) => {
  try {
    if (blockchain === 'btc') {
      const didTxnObject = await client.call({
        url: `${mdipUrl}/${'getutxos'}`,
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
 * Method to sign a transaction.
 * @param {string} mdipUrl
 * @param {string} rawTx
 * @param {string} privKey
 */
client.signRawTx = async (mdipUrl, rawTx, privKey) => {
  const signedTx = await client.call({
    url: `${mdipUrl}/${'signTx'}`,
    method: 'POST',
    params: { rawTx, privKey },
  });
  return signedTx.result;
};

/**
 * Method to sign and broadcast the transaction on the blockchain.
 * @param {string} mdipUrl
 * @param {string} rawTx
 * @param {string} privKey
 */
client.sendSignedTx = async (mdipUrl, rawTx, privKey) => {
  const signedTx = await client.call({
    url: `${mdipUrl}/${'sendSignedTx'}`,
    method: 'POST',
    params: { rawTx, privKey },
  });
  return signedTx.result;
};

/**
 * Create a new MDIP DID.
 * @param {string} blockchain
 * @param {string} network
 * @param {string} tx
 */
client.createNewMdipDID = async (blockchain, network, tx) => {
  if (blockchain === 'btc') {
    const txRef = await txidToTxref(tx, network);
    const extractedRef = txRef.split(':')[1];
    return `did:mdip:btc-${extractedRef}`;
  }
  return null;
};

/**
 * Create a new MDIP DID.
 * @param {string} blockchain
 * @param {string} signedTx
 */
client.issueNewClaim = async ({
  mdipURL,
  blockchain,
  attestorDID,
  requestorDID,
  claimType,
  claimData,
  attestorPublicKey,
  attestorPrivateKey,
}) => {
  if (blockchain === 'btc') {
    const issuedClaim = await client.call({
      url: `${mdipURL}/${'issueNewClaim'}`,
      method: 'POST',
      params: {
        attestorDID,
        requestorDID,
        claimType,
        claimData,
        attestorPublicKey,
        attestorPrivateKey,
      },
    });
    return issuedClaim;
  }
  return null;
};

/**
 * Create a new verifiable presentation.
 * @param {string} blockchain
 * @param {object} vc verifiable claim
 * @param {string} privateKey
 */
client.createVerifiablePresentation = async (
  blockchain,
  vc,
  publicKey,
  privateKey,
  challenge,
  domain,
  givenNetwork
) => {
  if (blockchain === 'btc') {
    const parsedVC = JSON.parse(vc);
    const vp = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: 'VerifiablePresentation',
      verifiableCredential: [parsedVC],
    };
    let network = bitcoin.networks.testnet;
    if (givenNetwork === 'mainnet') {
      network = bitcoin.networks.bitcoin;
    }
    const keyPair = bitcoin.ECPair.fromWIF(privateKey, network);
    const obatinedPrivKey = keyPair.privateKey;
    const message = JSON.stringify(vc);
    const signature = bitcoinMessage.sign(
      message,
      obatinedPrivKey,
      keyPair.compressed,
      { extraEntropy: randomBytes(32) }
    );
    const createdAt = new Date().toISOString();
    vp.proof = {
      type: 'EcdsaSecp256k1VerificationKey2019',
      created: createdAt,
      proofPurpose: 'authentication',
      verificationMethod: publicKey, // TODO: use DID fragments to point to the public key.
      challenge,
      // The domain value can be any string or URI,
      // and the challenge should be a randomly generated string.
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
 */
client.broadcast = async (mdipUrl, signedTx) => {
  const sentTx = await client.call({
    url: `${mdipUrl}/${'broadcast'}`,
    method: 'POST',
    params: { signedTx },
  });
  return sentTx.result;
};
