const request = require('request');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const { randomBytes } = require('crypto');
const Web3 = require('web3');
const fs = require('fs');
const ethDID = require('./utils/eth-sign.js');

const client = exports;
const web3 = new Web3();

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
        reject(resp && resp.error);
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
 */
client.storeDidDoc = async (didDocPath, mdipUrl) => {
  try {
    const response = await client.upload({
      url: `${mdipUrl}/${'storeDoc'}`,
      path: didDocPath,
    });
    return response;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Method to create transaction for DID creation.
 * @param {string} didDoc
 * @param {object} didInputs
 */
client.createDIDTx = async (didDoc, publicKey, privateKey, didInputs, mdipUrl) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const type = 'create';
      const rawTx = await client.call({
        url: `${mdipUrl}/${'createDIDRawTx'}`,
        method: 'POST',
        params: {
          blockchain, type, didDoc, publicKey,
        },
      });
      let signedTx = await ethDID.sign(privateKey, rawTx, publicKey);
      signedTx = signedTx.data;
      const sentTx = await client.call({
        url: `${mdipUrl}/${'broadcast'}`,
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
 * Create a new MDIP DID.
 * @param {string} blockchain
 * @param {string} network
 * @param {string} tx
 */
client.createNewMdipDID = async (blockchain, network, tx) => {
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
  if (blockchain === 'eth') {
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
        blockchain,
      },
    });
    console.log('This is the issued claim', issuedClaim);
    return issuedClaim;
  }
  return null;
};
/**
 * Update MDIP DID doc.
 * @param {string} didDoc
 * @param {object} didInputs
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
      const type = 'update';
      const rawTx = await client.call({
        url: `${mdipUrl}/${'createDIDRawTx'}`,
        method: 'POST',
        params: {
          blockchain, type, didDoc, publicKey, cid,
        },
      });

      let signedTx = await ethDID.sign(privateKey, rawTx, publicKey);
      signedTx = signedTx.data;
      const sentTx = await client.call({
        url: `${mdipUrl}/${'broadcast'}`,
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
 * Update MDIP DID doc.
 * @param {string} didDoc
 * @param {object} didInputs
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
      const type = 'transfer';
      const rawTx = await client.call({
        url: `${mdipUrl}/${'createDIDRawTx'}`,
        method: 'POST',
        params: {
          blockchain, type, publicKey, newOwner, cid,
        },
      });

      let signedTx = await ethDID.sign(privateKey, rawTx, publicKey);
      signedTx = signedTx.data;
      const sentTx = await client.call({
        url: `${mdipUrl}/${'broadcast'}`,
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
 * Delete MDIP DID doc.
 * @param {string} didDoc
 * @param {object} didInputs
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

      const type = 'delete';
      const rawTx = await client.call({
        url: `${mdipUrl}/${'createDIDRawTx'}`,
        method: 'POST',
        params: {
          blockchain, type, publicKey, cid,
        },
      });

      let signedTx = await ethDID.sign(privateKey, rawTx, publicKey);
      signedTx = signedTx.data;
      const sentTx = await client.call({
        url: `${mdipUrl}/${'broadcast'}`,
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
 * Read MDIP DID doc.
 * @param {string} didDoc
 * @param {object} didInputs
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
        url: `${mdipUrl}/${'readDID'}`,
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
  givenNetwork,
) => {
  const parsedVC = JSON.parse(vc);
  const vp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: 'VerifiablePresentation',
    verifiableCredential: [parsedVC],
  };
  const message = JSON.stringify(vc);
  let signature;
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
  } if (blockchain === 'eth') {
    signature = await web3.eth.accounts.sign(message, `0x${privateKey}`);
  } if (signature) {
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
      jws: signature.signature.toString('base64'),
    };
    return vp;
  }
  return null;
};
