const request = require('request');
const propertiesReader = require('properties-reader');
const i18n = require('../../i18n');
const {
  POST_METHOD,
  RPC_ID,
  RPC_VERSION,
  CONTENT_TYPE,
  FEE_PER_BYTE,
  WEIGHTED_INPUT,
  WEIGHTED_OUTPUT,
} = require('./constants');

const props = propertiesReader('./etc/local.conf');
const Clients = exports;

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

const calculateFee = (inputs, outputs) => {
  const txSize = inputs * WEIGHTED_INPUT + outputs * WEIGHTED_OUTPUT + inputs;
  return (FEE_PER_BYTE * txSize) / 10 ** 8; // 10 ** 8 is same as Math.pow(10, 8)
};

/**
 * Create, sign and send a transaction on the BTC testnet
 * @param {object} txnObject
 * @returns {object}
 */
// eslint-disable-next-line object-curly-newline
async function sendTxn({ fromAddr, toAddr, amount, fee, privKey, OP_RETURN }) {
  if (!fromAddr || !toAddr || !amount || !fee || !privKey || !OP_RETURN) {
    return { success: false, message: i18n('Missing parameters') };
  }
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(fee) || (isNaN(fee) && Number(fee) < 0)) {
    return { success: false, message: i18n('Invalid fee') };
  }
  try {
    const givenFee = fee;
    const decPrivKey = privKey;
    const unspents = (await btcClient('listunspent', [1, 9999999, [fromAddr]]))
      .result;
    if (unspents.length) {
      const inputs = [];
      const outputs = {};
      let totalAmount = 0;
      unspents.forEach((x) => {
        inputs.push({ txid: x.txid, vout: x.vout });
        totalAmount += x.amount;
      });
      if (totalAmount >= Number(amount) + Number(givenFee)) {
        const changeAmt = (totalAmount - (Number(amount) + Number(givenFee))).toFixed(
          8,
        );
        outputs[toAddr] = Number(amount);
        if (Number(changeAmt) > 0) {
          outputs[fromAddr] = changeAmt;
        }
        outputs.data = OP_RETURN;
        const rawTx = await btcClient('createrawtransaction', [
          inputs,
          outputs,
        ]);
        const signedTx = await btcClient('signrawtransactionwithkey', [
          rawTx.result,
          [decPrivKey],
        ]);
        if (signedTx.result && signedTx.result.complete) {
          const sentTx = await btcClient('sendrawtransaction', [
            signedTx.result.hex,
          ]);
          sentTx['sent-amount'] = String(totalAmount);
          sentTx.fee = givenFee;
          return {
            success: true,
            message: 'Txn sent successfully.',
            data: { txHashObj: sentTx },
          };
        }
        return {
          success: false,
          message:
            i18n('Error in broadcasting Transaction: Transaction signing is not complete. More signatures awaited.'),
        };
      }
      return {
        success: false,
        message: i18n('Sender does not have sufficient balance.'),
      };
    }
    return { success: false, message: i18n('Sender does not have funds.') };
  } catch (errorT) {
    return { success: false, message: errorT.message };
  }
}

Clients.btcClient = btcClient;
Clients.helpers = {
  isJSON,
  calculateFee,
  sendTxn,
};
