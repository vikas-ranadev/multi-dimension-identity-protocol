const express = require('express');

const api = require('./api');
const p2p = require('./p2p.api');

const daemonRouter = express.Router();

daemonRouter.get('/getuptime', api.getuptime);
daemonRouter.get('/serverinfo', api.getServerInfo);
daemonRouter.get('/gettxdetails', api.getTxDetails);
daemonRouter.get('/getfunds', api.getFunds);
daemonRouter.post('/preparetransaction', api.prepareTransaction);
daemonRouter.post('/storeDoc', api.storeDoc);
daemonRouter.post('/broadcast', api.broadcast);
daemonRouter.post('/issueNewClaim', api.issueNewClaim);
daemonRouter.post('/updateDID', api.updateDID);
daemonRouter.post('/deleteDID', api.deleteDID);
daemonRouter.get('/readDID', api.readDID);
daemonRouter.post('/getutxos', api.getutxos);
daemonRouter.post('/checkconfs', api.checkconfs);
daemonRouter.post('/ethfaucet', api.fundETHAddress);
daemonRouter.get('/testmempoolaccept', api.testMempoolAccept);
daemonRouter.get('/gettransactionhistory', api.getTransactionHistory);
daemonRouter.get('/getTxidIPNS', api.getTxidIPNS);
daemonRouter.post('/p2p/addsubs', p2p.addSubs);
daemonRouter.post('/p2p/broadcast', p2p.broadcast);
daemonRouter.post('/p2p/fetchbroadcasts', p2p.fetchBroadcasts);

module.exports = daemonRouter;
