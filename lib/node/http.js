const express = require('express');
const path = require('path');
const propertiesReader = require('properties-reader');
const { mainnet } = require('../protocol/networks');
const routes = require('./api.routes');
const { connectDB } = require('../utils/db');
const { checkConnections } = require('../utils/util');

const props = propertiesReader(path.join(`${__dirname}/../../bin/etc/local.conf`));

const mongodbUrl = props.get('mongodb.url');
const mongodbUser = props.get('mongodb.username');
const mongodbPass = props.get('mongodb.password');

const node = express();

node.use(express.json({ limit: '200kb' }));
node.use(express.urlencoded({ extended: true }));

node.use('/', routes);

const Node = exports;

Node.start = async () => {
  if (mongodbUrl) {
    await connectDB(mongodbUrl, mongodbUser, mongodbPass);
  }
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
