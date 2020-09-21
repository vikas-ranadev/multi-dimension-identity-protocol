/** TODO: Add more structure to it. add config */
const request = require('request');

const Clients = exports;

const isJSON = (data) => {
  try {
    JSON.parse(data);
    return true;
  } catch (error) {
    return false;
  }
};

const btcUser = 'bitcoin';
const btcPass = 'bitcoin';
const btcUrl = 'http://localhost:18332';

const btcClient = (method, params) => {
  const auth = Buffer.from(`${btcUser}:${btcPass}`).toString('base64');

  const req = {
    url: btcUrl,
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '1.0',
      id: 'btc',
      method,
      params,
    }),
    headers: { 'Content-Type': 'text/plain', Authorization: `Basic ${auth}` },
  };
  return new Promise((resolve, reject) => {
    request(req, (err, httpResponse, result) => {
      if (err) {
        reject(err);
      }
      if (isJSON(result)) {
        if (JSON.parse(result).result) {
          resolve(JSON.parse(result));
        } else {
          reject(JSON.parse(result).error);
        }
      } else {
        reject(err);
      }
    });
  });
};

const calculateFee = (inputs, outputs) => {
  // eslint-disable-next-line prefer-const
  let feePerByte = 2;
  // eslint-disable-next-line prefer-const
  let txSize = inputs * 180 + outputs * 34 + inputs;
  return (feePerByte * txSize) / 10 ** 8;
};

Clients.btcClient = btcClient;
Clients.helpers = { isJSON, calculateFee };
