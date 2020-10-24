const request = require('request');
const bitcoin = require('bitcoinjs-lib'); // v4.x.x
const bitcoinMessage = require('bitcoinjs-message');
const { randomBytes } = require('crypto');
const Web3 = require('web3');
const { txidToTxref } = require('./utils/tx-ref');
const ethDID = require('../ethDID/ethDID');
const IPFS = require('../ipfs/ipfs');
const ipfs = require('../ipfs/ipfs');

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
        reject(resp && resp.error);
      }
    });
  });
};
/**
 * Method to store DidDoc on IPFS.
 * @param {string} didDocPath
 */
client.storeDidDoc = async (didDocPath) => {
  try {
    const didDoc = await IPFS.upload(didDocPath);
    return didDoc;
  } catch (error) {
    throw new Error(error);
  }
};
const func = async ()=>{
  let result = await createDIDTx('QmPNW5RT4gC7Tn61oUKHmgLiuoBEAabcVSeiCRtg8UBNVd','0x70B570609Fa0eBD2C8af9515504E1d1884081ef9','31fd7ca64d288601a03d7ce693f552d33b35a2e29d419720403b23487cd7b526',{data:{blockchain:'eth'}});
console.log(result);
}
 func();
/**
 * Method to create transaction for DID creation.
 * @param {string} didDoc
 * @param {object} didInputs
 */
client.createDIDTx = async (didDoc, publicKey, privateKey, didInputs) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const signedTx = await ethDID.create(privateKey, didDoc, publicKey);
     
      const sentTx = await client.call({
        url: `${mdipUrl}/${'broadcast'}`,
        method: 'POST',
        params: { signedTx,blockchain},
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
    const extractedRef = tx.events.CreatedDID.returnValues.id;
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
client.updateDIDdoc = async (did, newdidDoc, publicKey, privateKey, didInputs) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = did.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const cid = part3.substr(4, part3.length);
      const didTx = await ethDID.setMetadata(privateKey, publicKey, cid, newdidDoc);
      return didTx.data;
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
client.updateDIDowner = async (did, publicKey, privateKey, newOwner, didInputs) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = did.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const cid = part3.substr(4, part3.length);
      const didTx = await ethDID.setController(privateKey, publicKey, newOwner, cid);
      return didTx.data;
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
client.deleteDID = async (did, publicKey, privateKey, didInputs) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = did.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const cid = part3.substr(4, part3.length);
      const didTx = await ethDID.deleteDID(privateKey, publicKey, cid);
      return didTx.data;
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
client.readDID = async (did, publicKey, privateKey, didInputs) => {
  try {
    const { blockchain } = didInputs.data;
    if (blockchain === 'eth') {
      const [part1, part2, part3] = did.split(':');
      if (part1 !== 'did' || part2 !== 'mdip' || part3.substr(0, 3) !== 'eth') {
        throw new Error('Invalid DID sent.');
      }
      const cid = part3.substr(4, part3.length);
      const didTx = await ethDID.getDID(privateKey, publicKey, cid);
      const didDoc = ipfs.download(didTx.data.metadata);
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
    const web3 = new Web3();
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
