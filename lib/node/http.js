const express = require('express');
const { uptime } = require('./node');
const { mainnet } = require('../protocol/networks');
const ipfsRouter = require('../ipfs/route/router.js');
const ethDIDRouter = require('../ethDID/router/routes.js');

const node = express();

/**
 * Endpoint to check daemon's uptime.
 * @returns {object} "uptime" in milliseconds
 */
node.get('/getuptime', (req, res) => {
  res.status(200).send({ uptime: new Date().getTime() - uptime() });
});

const Node = exports;
node.use(express.urlencoded({ extended: true }));
node.use(express.json());
// config ipfs router
node.use('/ipfs/', ipfsRouter);
node.use('/ethdid/',ethDIDRouter);

Node.start = () => {
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};
