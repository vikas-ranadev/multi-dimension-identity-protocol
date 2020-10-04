const express = require('express')
const app = express();
var bodyParser = require('body-parser')
var Web3 = require('web3')
var utils = require('../utils/utils')
var env = require('../utils/env.json')

var web3 = new Web3(new Web3.providers.HttpProvider(env.RopstenInfura))

var contract = new web3.eth.Contract(env.contractABI, env.contractAddress);

app.use(bodyParser.json())

async function getDID(req, res) {
    try {
        var callPromise = await contract.methods.dids(web3.utils.toHex(req.body.inputByte32)).call().then(async function (result) {
            return result
        });
        callPromise.metadata = utils.getMultihashFromBytes32(callPromise.metadata)
        res.send({ success: true, data: callPromise })
    } catch (err) {
        res.send({ success: false, data: err })
    }
}


async function getController(req, res) {
    try {
        var callPromise = await contract.methods.getController(web3.utils.toHex(req.body.inputByte32)).call().then(async function (result) {
            return result
        });
        res.send({ success: true, data: callPromise })
    } catch (err) {
        res.send({ success: false, data: err })
    }
}


async function getNonce(req, res) {
    try {
        var callPromise = await contract.methods.nonce().call().then(async function (result) {
            return result
        });
        res.send({ success: true, data: callPromise })
    } catch (err) {
        res.send({ success: false, data: err })
    }
}



 async function create(req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 5000000000,
            from: req.body.pubKey
        };
        let bytes32 = utils.getBytes32FromMultiash(req.body.cid); 
        let tx
        var callPromise = await contract.methods.createDID(bytes32.digest).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err+'' })
    }
}



async function setController(req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 5000000000,
            from: req.body.pubKey
        };
        let tx
        var callPromise = await contract.methods.setController(web3.utils.toHex(req.body.inputByte32), req.body.newAddress).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err })
    }
}



 async function setMetadata(req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 5000000000,
            from: req.body.pubKey
        };
        let bytes32 = utils.getBytes32FromMultiash(req.body.cid);
        let tx
        var callPromise = await contract.methods.setMetadata(web3.utils.toHex(req.body.inputByte32),bytes32.digest).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err })
    }
}



async function deleteDID(req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 5000000000,
            from: req.body.pubKey
        };
        let tx
        var callPromise = await contract.methods.deleteDID(web3.utils.toHex(req.body.inputByte32)).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err })
    }
}

module.exports={
    getDID,
    getController,
    getNonce,
    create,
    setController,
    setMetadata,
    deleteDID
}

app.listen(3000)
console.log("App Running on port 3000")

