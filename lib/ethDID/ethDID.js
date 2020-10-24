const Web3 = require('web3');
const utils = require('./utils/utils');
const env = require('./utils/env.json');

const web3 = new Web3(new Web3.providers.HttpProvider(env.RopstenInfura));

const contract = new web3.eth.Contract(env.contractABI, env.contractAddress);



async function getDID(did) {
  try {
    const callPromise = await contract.methods.dids(web3.utils.toHex(did))
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
    const callPromise = await contract.methods.getController(web3.utils.toHex(did))
      .call()
      .then(async (result) => result);
    return { success: true, data: callPromise };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function getNonce() {
  try {
    const callPromise = await contract.methods.nonce().call().then(async (result) => result);
    return { success: true, data: callPromise };
  } catch (err) {
    return { success: false, data: err };
  }
}


async function create(privKey, cid, pubKey) {
  try {
    web3.eth.accounts.wallet.add(privKey);
    //  let gas = await contract.methods.createDID(bytes32.digest).estimateGas({from: pubKey});
    const bytes32 = utils.getBytes32FromMultiash(cid);
    const overrideOptions = {
      gasLimit: await contract.methods.createDID(bytes32.digest).estimateGas({from:pubKey}),
      gasPrice: await web3.eth.getGasPrice(),
      from: pubKey,
    };
     let tx; 
    web3.eth.signTransaction({
      from: pubKey,
      gasPrice: overrideOptions.gasPrice,
      gas: overrideOptions.gasLimit,
      to: env.contractAddress,
      data: await contract.methods.createDID(bytes32.digest).encodeABI()
  })

  
    
     // .send(overrideOptions)
      .then((transaction) => {
         tx = transaction;
        
      });
    return { success: true, data: tx };
  } catch (err) {
    return { success: false, data: `${err}` };
  }
}

async function setController(privKey, pubKey, newOwner, did) {
  try {
    web3.eth.accounts.wallet.add(privKey);
    const overrideOptions = {
      gasLimit: await contract.methods.setController(did, newOwner).estimateGas({from:pubKey}),
      gasPrice: await web3.eth.getGasPrice(),
      from: pubKey,
    };
    let tx;
    await contract.methods.setController(did, newOwner)
      .send(overrideOptions)
      .then((transaction, err) => {
        if (!err) tx = transaction;
        else tx = err;
      });
    return { success: true, data: tx };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function setMetadata(privKey, pubKey, did, cid) {
  try {
    web3.eth.accounts.wallet.add(privKey);
    const bytes32 = utils.getBytes32FromMultiash(cid);
    const overrideOptions = {
      gasLimit: await contract.methods.setMetadata(web3.utils.toHex(did), bytes32.digest).estimateGas({from:pubKey}),
      gasPrice: await web3.eth.getGasPrice(),
      from: pubKey,
    };
    
    let tx;
    await contract.methods.setMetadata(web3.utils.toHex(did), bytes32.digest)
      .send(overrideOptions)
      .then((transaction, err) => {
        if (!err) tx = transaction;
        else tx = err;
      });
    return { success: true, data: tx };
  } catch (err) {
    return { success: false, data: err };
  }
}

async function deleteDID(privKey, pubKey, did) {
  try {
    web3.eth.accounts.wallet.add(privKey);
    const overrideOptions = {
      gasLimit: await contract.methods.deleteDID(web3.utils.toHex(did)).estimateGas({from:pubKey}),
      gasPrice: await web3.eth.getGasPrice(),
      from: pubKey,
    };
    let tx;
    await contract.methods.deleteDID(web3.utils.toHex(did))
      .send(overrideOptions)
      .then((transaction, err) => {
        if (!err) tx = transaction;
        else tx = err;
      });
    return { success: true, data: tx };
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
