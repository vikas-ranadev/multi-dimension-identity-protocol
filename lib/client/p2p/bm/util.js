/* eslint-disable object-curly-newline */
const axios = require('axios');
const propertiesReader = require('properties-reader');
const path = require('path');
// const i18n = require('../../i18n');
const { POST_METHOD } = require('../../../utils/constants');

const props = propertiesReader(
  path.join(`${__dirname}/../../../../bin/etc/local.conf`)
);

const Util = exports;

const bmUrl = props.get('bm.url');
const bmUser = props.get('bm.username');
const bmPass = props.get('bm.password');

/**
 * Utility method to interact with the keychain node.
 * @param {string} method
 * @param {array} params
 * @returns {object}
 */
const request = async (url, method, body = {}) => {
  if (!url || !method || (method === 'POST' && !body)) {
    throw new Error('Invalid parameters');
  }

  const data = JSON.stringify(body);

  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
    },
    data: data,
  };
  try {
    const resp = await axios(config);
    return resp.data;
  } catch (error) {
    if (error && error.message) {
      throw new Error(error.message);
    }
    throw new Error('request cannot be completed');
  }
};

/**
 * Utility method to interact with the bitmessage node.
 * @param {string} method
 * @param {array} params
 * @returns {object}
 */
const bmClient = async (method, params = []) => {
  const URL = bmUrl;
  const username = bmUser;
  const password = bmPass;

  if (!URL || !username || !password) {
    throw new Error('No config provided to connect to the bitmessage node.');
  }
  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  const data = JSON.stringify({
    jsonrpc: '2.0',
    id: 'keychainMDIP',
    method,
    params,
  });

  const config = {
    method: POST_METHOD,
    url: URL,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    data: data,
  };
  try {
    const resp = await axios(config);
    return resp.data;
  } catch (error) {
    if (error && error.message) {
      throw new Error(error.message);
    }
    throw new Error('request cannot be completed');
  }
};

Util.bmClient = bmClient;
Util.request = request;
