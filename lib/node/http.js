const express = require('express');
const bodyParser = require('body-parser');
const propertiesReader = require('properties-reader');
const { mainnet } = require('../protocol/networks');
const routes = require('./api.routes');
const { connectDB } = require('../utils/db');

const props = propertiesReader('./etc/local.conf');

const mongodbUrl = props.get('mongodb.url');
const mongodbUser = props.get('mongodb.username');
const mongodbPass = props.get('mongodb.password');

const node = express();

node.use(bodyParser.json({ limit: '200kb' }));
node.use(bodyParser.urlencoded({ extended: true }));

node.use('/', routes);

const Node = exports;

Node.start = async () => {
  if (mongodbUrl) {
    await connectDB(mongodbUrl, mongodbUser, mongodbPass);
  }
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};
