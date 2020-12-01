const express = require('express');

const api = require('./api');

const daemonRouter = express.Router();

daemonRouter.get('/getuptime', api.getuptime);
daemonRouter.post('/createDIDRawTx', api.createDIDRawTx);
daemonRouter.post('/storeDoc', api.storeDoc);
daemonRouter.post('/signTx', api.signTx);
daemonRouter.post('/sendSignedTx', api.sendSignedTx);
daemonRouter.post('/broadcast', api.broadcast);
daemonRouter.post('/issueNewClaim', api.issueNewClaim);
daemonRouter.post('/updateDID', api.updateDID);
daemonRouter.post('/deleteDID', api.deleteDID);
daemonRouter.post('/readDID', api.readDID);
daemonRouter.post('/getutxos', api.getutxos);
daemonRouter.post('/checkconfs', api.checkconfs);

module.exports = daemonRouter;
