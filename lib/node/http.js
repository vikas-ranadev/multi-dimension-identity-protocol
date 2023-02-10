const express = require('express');
const { mainnet } = require('../protocol/networks');
const routes = require('./api.routes');
const { checkConnections } = require('../utils/util');
require('./p2p-daemon');

const node = express();

node.use(express.json({ limit: '200kb' }));
node.use(express.urlencoded({ extended: true }));

node.use('/', routes);

const Node = exports;

Node.start = async () => {
  try {
    await checkConnections();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    process.exit(1);
  }
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};

if (process.env.MDIP_ENV === 'dev') {
  Node.start();
}
