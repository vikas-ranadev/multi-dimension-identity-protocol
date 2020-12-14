const Web3 = require('web3');
const utils = require('../utils/eth.util');
const env = require('../config/eth.env.json');

const web3 = new Web3(new Web3.providers.HttpProvider(env.RopstenInfura));

const contract = new web3.eth.Contract(env.contractABI, env.contractAddress);

async function getDID(did) {
  try {
    const callPromise = await contract.methods
      .dids(web3.utils.toHex(did))
      .call()
      .then(async (result) => result);
    callPromise.metadata = utils.getMultihashFromBytes32(callPromise.metadata);
    return { success: true, data: callPromise };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function getController(did) {
  try {
    const callPromise = await contract.methods
      .getController(web3.utils.toHex(did))
      .call()
      .then(async (result) => result);
    return { success: true, data: callPromise };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function getNonce() {
  try {
    const callPromise = await contract.methods
      .nonce()
      .call()
      .then(async (result) => result);
    return { success: true, data: callPromise };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function create(cid, pubKey) {
  try {
    const bytes32 = utils.getBytes32FromMultiash(cid);
    const txObj = {
      gasLimit: await contract.methods
        .createDID(bytes32.digest)
        .estimateGas({ from: pubKey }),
      gasPrice: await web3.eth.getGasPrice(),
      contractAddress: env.contractAddress,
      data: await contract.methods.createDID(bytes32.digest).encodeABI(),
      provider: env.RopstenInfura,
    };
    return { success: true, data: txObj };
  } catch (err) {
    return { success: false, data: `${err}` };
  }
}

async function setController(pubKey, newOwner, did) {
  try {
    const txObj = {
      gasLimit: await contract.methods
        .setController(did, newOwner)
        .estimateGas({ from: pubKey }),
      gasPrice: await web3.eth.getGasPrice(),
      contractAddress: env.contractAddress,
      data: await contract.methods.setController(did, newOwner).encodeABI(),
      provider: env.RopstenInfura,
    };
    return { success: true, data: txObj };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function setMetadata(pubKey, did, cid) {
  try {
    const bytes32 = utils.getBytes32FromMultiash(cid);
    const txObj = {
      gasLimit: await contract.methods
        .setMetadata(web3.utils.toHex(did), bytes32.digest)
        .estimateGas({ from: pubKey }),
      gasPrice: await web3.eth.getGasPrice(),
      contractAddress: env.contractAddress,
      data: await contract.methods
        .setMetadata(web3.utils.toHex(did), bytes32.digest)
        .encodeABI(),
      nonce: await web3.eth.getTransactionCount(pubKey),
      provider: env.RopstenInfura,
    };

    return { success: true, data: txObj };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function deleteDID(pubKey, did) {
  try {
    const txObj = {
      gasLimit: await contract.methods
        .deleteDID(web3.utils.toHex(did))
        .estimateGas({ from: pubKey }),
      gasPrice: await web3.eth.getGasPrice(),
      contractAddress: env.contractAddress,
      data: await contract.methods.deleteDID(web3.utils.toHex(did)).encodeABI(),
      provider: env.RopstenInfura,
    };

    return { success: true, data: txObj };
  } catch (err) {
    return { success: false, data: err };
  }
}

module.exports = {
  getDID,
  getController,
  getNonce,
  create,
  setController,
  setMetadata,
  deleteDID,
};
