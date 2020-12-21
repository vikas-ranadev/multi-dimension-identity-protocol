const request = require('request');
const propertiesReader = require('properties-reader');
const WEB3 = require('web3');
const {
  POST_METHOD,
  RPC_ID,
  RPC_VERSION,
  CONTENT_TYPE,
  WEIGHTED_INPUT,
  WEIGHTED_OUTPUT,
} = require('./constants');

const props = propertiesReader('./etc/local.conf');

const web3 = new WEB3(new WEB3.providers.HttpProvider(props.get('mdip.ethHTTPProvider')));

const Util = exports;

/**
 * Function to check whether a given string is JSON or not.
 * @param {string} data
 * @returns {boolean}
 */
const isJSON = (data) => {
  try {
    JSON.parse(data);
    return true;
  } catch (error) {
    return false;
  }
};

const btcUser = props.get('deps.username');
const btcPass = props.get('deps.password');
const btcUrl = props.get('deps.url');

/**
 * Utility method to interact with the bitcoin node.
 * @param {string} method
 * @param {array} params
 * @returns {object}
 */
const btcClient = (method, params) => {
  if (!btcUrl || !btcUser || !btcPass) {
    throw new Error('No config provided to connect to the BTC node.');
  }
  const auth = Buffer.from(`${btcUser}:${btcPass}`).toString('base64');

  const req = {
    url: btcUrl,
    method: POST_METHOD,
    body: JSON.stringify({
      jsonrpc: RPC_VERSION,
      id: RPC_ID,
      method,
      params,
    }),
    headers: { 'Content-Type': CONTENT_TYPE, Authorization: `Basic ${auth}` },
  };
  return new Promise((resolve, reject) => {
    request(req, (err, httpResponse, result) => {
      if (err) {
        reject(err);
      }
      if (isJSON(result)) {
        const parsedRes = JSON.parse(result);
        if (parsedRes && parsedRes.result) {
          resolve(parsedRes);
        } else {
          reject(parsedRes && parsedRes.error);
        }
      } else {
        reject(err);
      }
    });
  });
};

/**
 * Utility method to calculate fee for a specific transaction.
 * @param {number} inputs
 * @param {number} outputs
 * @returns {number}
 */
const calculateFee = async (inputs, outputs) => {
  try {
    const { feerate } = (await btcClient('estimatesmartfee', [6])).result;
    if (feerate) {
      const txSize = inputs * WEIGHTED_INPUT + outputs * WEIGHTED_OUTPUT + inputs;
      const nulldataTxSize = txSize + 80;
      return {
        fee: (feerate * 1e5 * txSize) / 10 ** 8,
        nulldataFee: (feerate * 1e5 * nulldataTxSize) / 10 ** 8,
      };
      // 10 ** 8 is same as Math.pow(10, 8)
    }
    throw new Error('feerate not found.');
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Util to calculate ETH fees.
 * @param {string} fromAddr
 * @param {string} toAddr
 * @param {string} value
 * @returns {Object}
 */
const calculateFeeETH = async (fromAddr, toAddr, value) => {
  let gas = 21000;
  const gasPrice = await web3.eth.getGasPrice();
  if (toAddr) {
    gas = await web3.eth.estimateGas({
      from: fromAddr,
      to: toAddr,
      value,
    });
  }
  const fee = ((gas * Number(gasPrice)) / 10 ** 18).toFixed(18);
  return { gas: Number(gas), gasPrice: Number(gasPrice), fee: Number(fee) };
};

Util.btcClient = btcClient;
Util.helpers = {
  isJSON,
  calculateFee,
  calculateFeeETH,
};
