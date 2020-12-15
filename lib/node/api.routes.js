const express = require('express');

const api = require('./api');

const daemonRouter = express.Router();

daemonRouter.get('/getuptime', api.getuptime);
// daemonRouter.post('/createDIDRawTx', api.createDIDRawTx);
daemonRouter.post('/preparetransaction', api.prepareTransaction);
daemonRouter.post('/storeDoc', api.storeDoc);
daemonRouter.post('/broadcast', api.broadcast);
daemonRouter.post('/issueNewClaim', api.issueNewClaim);
daemonRouter.post('/updateDID', api.updateDID);
daemonRouter.post('/deleteDID', api.deleteDID);
daemonRouter.post('/readDID', api.readDID);
daemonRouter.post('/getutxos', api.getutxos);
daemonRouter.post('/checkconfs', api.checkconfs);
daemonRouter.post('/ethfaucet', api.fundETHAddress);

module.exports = daemonRouter;
