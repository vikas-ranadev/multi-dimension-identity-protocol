const Web3 = require('web3');
const utils = require('../utils/utils');
const env = require('../utils/env.json');

const web3 = new Web3(new Web3.providers.HttpProvider(env.RopstenInfura));

const contract = new web3.eth.Contract(env.contractABI, env.contractAddress);

async function getDID(req, res) {
  try {
    const callPromise = await contract.methods.dids(web3.utils.toHex(req.body.did))
      .call()
      .then(async (result) => result);
    callPromise.metadata = utils.getMultihashFromBytes32(callPromise.metadata);
    res.send({ success: true, data: callPromise });
  } catch (err) {
    res.send({ success: false, data: err });
  }
}

async function getController(req, res) {
  try {
    const callPromise = await contract.methods.getController(web3.utils.toHex(req.body.did))
      .call()
      .then(async (result) => result);
    res.send({ success: true, data: callPromise });
  } catch (err) {
    res.send({ success: false, data: err });
  }
}

async function getNonce(req, res) {
  try {
    const callPromise = await contract.methods.nonce().call().then(async (result) => result);
    res.send({ success: true, data: callPromise });
  } catch (err) {
    res.send({ success: false, data: err });
  }
}

async function create(req, res) {
  try {
    web3.eth.accounts.wallet.add(req.body.privKey);
    const overrideOptions = {
      gasLimit: 6700000,
      gasPrice: 5000000000,
      from: req.body.pubKey,
    };
    const bytes32 = utils.getBytes32FromMultiash(req.body.cid);
    let tx;
    await contract.methods.createDID(bytes32.digest)
      .send(overrideOptions)
      .then((transaction, err) => {
        if (!err) tx = transaction;
        else tx = err;
      });
    res.send({ success: true, data: tx });
  } catch (err) {
    res.send({ success: false, data: `${err}` });
  }
}

async function setController(req, res) {
  try {
    web3.eth.accounts.wallet.add(req.body.privKey);
    const overrideOptions = {
      gasLimit: 6700000,
      gasPrice: 5000000000,
      from: req.body.pubKey,
    };
    let tx;
    await contract.methods.setController(web3.utils.toHex(req.body.did), req.body.newAddress)
      .send(overrideOptions)
      .then((transaction, err) => {
        if (!err) tx = transaction;
        else tx = err;
      });
    res.send({ success: true, data: tx });
  } catch (err) {
    res.send({ success: false, data: err });
  }
}

async function setMetadata(req, res) {
  try {
    web3.eth.accounts.wallet.add(req.body.privKey);
    const overrideOptions = {
      gasLimit: 6700000,
      gasPrice: 5000000000,
      from: req.body.pubKey,
    };
    const bytes32 = utils.getBytes32FromMultiash(req.body.cid);
    let tx;
    await contract.methods.setMetadata(web3.utils.toHex(req.body.did), bytes32.digest)
      .send(overrideOptions)
      .then((transaction, err) => {
        if (!err) tx = transaction;
        else tx = err;
      });
    res.send({ success: true, data: tx });
  } catch (err) {
    res.send({ success: false, data: err });
  }
}

async function deleteDID(req, res) {
  try {
    web3.eth.accounts.wallet.add(req.body.privKey);
    const overrideOptions = {
      gasLimit: 6700000,
      gasPrice: 5000000000,
      from: req.body.pubKey,
    };
    let tx;
    await contract.methods.deleteDID(web3.utils.toHex(req.body.did))
      .send(overrideOptions)
      .then((transaction, err) => {
        if (!err) tx = transaction;
        else tx = err;
      });
    res.send({ success: true, data: tx });
  } catch (err) {
    res.send({ success: false, data: err });
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
