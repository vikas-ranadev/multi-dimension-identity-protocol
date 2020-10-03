const express = require('express')
const app = express();
var bodyParser = require('body-parser')
var Web3 = require('web3')
var utils = require('../utils/utils')
var web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/23b74b39f37e421f9c9b8e1d703e18d5"))
var contractABI = '[{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"dids","outputs":[{"name":"controller","type":"address"},{"name":"created","type":"uint256"},{"name":"updated","type":"uint256"},{"name":"metadata","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"id","type":"bytes32"}],"name":"getController","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_metadata","type":"bytes32"}],"name":"createDID","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"nonce","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"newController","type":"address"}],"name":"setController","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"},{"name":"_metadata","type":"bytes32"}],"name":"setMetadata","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"id","type":"bytes32"}],"name":"deleteDID","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"metadata","type":"bytes32"}],"name":"CreatedDID","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"bytes32"}],"name":"DeletedDID","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"metadata","type":"bytes32"}],"name":"SetMetadata","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"id","type":"bytes32"},{"indexed":false,"name":"newController","type":"address"}],"name":"SetController","type":"event"}]'
contractABI = JSON.parse(contractABI)
var contractAddress = '0x3587Cb12aAD00B6D42965Ac96bb77D8a1858C872'
var contract = new web3.eth.Contract(contractABI, contractAddress);

app.use(bodyParser.json())

app.get("/dids", async function (req, res) {
    try {
        var callPromise = await contract.methods.dids(web3.utils.toHex(req.body.inputByte32)).call().then(async function (result) {
            return result
        });
        res.send({ success: true, data: callPromise })
    } catch (err) {
        res.send({ success: false, data: err })
    }
});


app.get("/getController", async function (req, res) {
    try {
        var callPromise = await contract.methods.getController(web3.utils.toHex(req.body.inputByte32)).call().then(async function (result) {
            return result
        });
        res.send({ success: true, data: callPromise })
    } catch (err) {
        res.send({ success: false, data: err })
    }
});


app.get("/nonce", async function (req, res) {
    try {
        var callPromise = await contract.methods.nonce().call().then(async function (result) {
            return result
        });
        res.send({ success: true, data: callPromise })
    } catch (err) {
        res.send({ success: false, data: err })
    }
});



app.post("/createDID", async function (req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 150000000000,
            from: req.body.pubKey
        };
        let bytes32 = utils.getBytes32FromMultiash(req.body.cid); 
        let tx
        var callPromise = await contract.methods.createDID(bytes32.digest).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction.transactionHash
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err+'' })
    }
});



app.post("/setController", async function (req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 150000000000,
            from: req.body.pubKey
        };
        let tx
        var callPromise = await contract.methods.setController(web3.utils.toHex(req.body.inputByte32), req.body.newAddress).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction.transactionHash
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err })
    }
});



app.post("/setMetadata", async function (req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 150000000000,
            from: req.body.pubKey
        };
        let tx
        var callPromise = await contract.methods.setMetadata(web3.utils.toHex(req.body.inputByte32), web3.utils.toHex(req.body.metaData)).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction.transactionHash
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err })
    }
});



app.post("/deleteDID", async function (req, res) {
    try {
        web3.eth.accounts.wallet.add(req.body.privKey)
        var overrideOptions = {
            gasLimit: 6700000,
            gasPrice: 150000000000,
            from: req.body.pubKey
        };
        let tx
        var callPromise = await contract.methods.deleteDID(web3.utils.toHex(req.body.inputByte32)).send(overrideOptions).then(function (transaction, err) {
            if (!err) tx = transaction.transactionHash
            else tx = err
        });
        res.send({ success: true, data: tx })
    } catch (err) {
        res.send({ success: false, data: err })
    }
});



app.listen(3000)
console.log("App Running on port 3000")

