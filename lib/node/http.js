const express = require('express');
const { uptime } = require('./node');
const { mainnet } = require('../protocol/networks');

const node = express();

/**
 * Endpoint to check daemon's uptime.
 * @returns {object} "uptime" in milliseconds
 */
node.get('/getuptime', (req, res) => {
  res.status(200).send({ uptime: new Date().getTime() - uptime() });
});

const Node = exports;

Node.start = () => {
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};
