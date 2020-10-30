const express = require('express');
const bodyParser = require('body-parser');
const { mainnet } = require('../protocol/networks');
const routes = require('./api.routes');

const node = express();

node.use(bodyParser.json({ limit: '200kb' }));
node.use(bodyParser.urlencoded({ extended: true }));

node.use('/', routes);

const Node = exports;

Node.start = () => {
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};
