/** TODO: Add more structure to it. add config */
const request = require('request');
const { encode } = require('bs58check');
const createHash = require('create-hash');
const wif = require('wif');

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

/**
 * Create, sign and send a transaction on the BTC testnet
 * @param {object} txnObject
 * @returns {object}
 */
// eslint-disable-next-line object-curly-newline
async function sendTxn({ fromAddr, toAddr, amount, fee, privKey, OP_RETURN }) {
  if (!fromAddr || !toAddr || !amount || !fee || !privKey || !OP_RETURN) {
    return { success: false, message: 'Missing parameters' };
  }
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(fee) || (isNaN(fee) && Number(fee) < 0)) {
    return { success: false, message: 'Invalid fee' };
  }
  try {
    // let { fromAddr, toAddr, amount, fee: givenFee, privKey } = req.body;
    const givenFee = fee;
    const decPrivKey = privKey;
    // eslint-disable-next-line no-param-reassign
    amount = Number(amount);
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
      // let fee = calculateFee(unspents.length, 2);
      if (totalAmount >= amount + Number(givenFee)) {
        const changeAmt = (totalAmount - (amount + Number(givenFee))).toFixed(
          8,
        );
        outputs[toAddr] = amount;
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
            'Error in broadcasting Transaction: Transaction signing is not complete. More signatures awaited.',
        };
      }
      return {
        success: false,
        message: 'Sender does not have sufficient balance.',
      };
    }
    return { success: false, message: 'Sender does not have funds.' };
  } catch (errorT) {
    return { success: false, message: errorT.message };
  }
}

/**
 * Create a BTC address from child public key
 * @param {string} pubKey
 * @returns {string}
 */
function createBTCAddr(pubKey) {
  const tmpStore = pubKey;
  const sha256 = createHash('sha256').update(tmpStore).digest();
  const rmd160 = createHash('rmd160').update(sha256).digest();

  const tmpBuffer = Buffer.allocUnsafe(21);
  tmpBuffer.writeUInt8(0x6f, 0);
  rmd160.copy(tmpBuffer, 1);
  const btcAddr = encode(tmpBuffer);
  return btcAddr;
}

/**
 * Create importable private key
 * @param {string} pubKey
 * @returns {string}
 */
function obtainPrivKey(privKey) {
  const privateKey = Buffer.from(privKey, 'hex');
  const key = wif.encode(239, privateKey, true); // 239 for testent; 128 for mainnet
  return key;
}

Clients.btcClient = btcClient;
Clients.helpers = {
  isJSON,
  calculateFee,
  sendTxn,
  createBTCAddr,
  obtainPrivKey,
};
