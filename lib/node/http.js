const express = require('express');
const bodyParser = require('body-parser');
const { uptime } = require('./node');
const { mainnet } = require('../protocol/networks');
const ipfsRouter = require('../ipfs/route/router.js');
const ethDIDRouter = require('../ethDID/router/routes.js');
const { btcClient, helpers } = require('../utils/clients');
const i18n = require('../../i18n');

const node = express();

node.use(bodyParser.json({ limit: '200kb' }));
node.use(bodyParser.urlencoded({ extended: true }));

/**
 * Endpoint to check daemon's uptime.
 * @returns {object} "uptime" in milliseconds
 */
node.get('/getuptime', (req, res) => {
  res.status(200).send({ uptime: new Date().getTime() - uptime() });
});

node.post('/createDIDRawTx', async (req, res) => {
  const { didCreator, didUpdater } = req.body;
  if (!didCreator || !didUpdater) {
    return res
      .status(400)
      .send({ result: null, error: i18n('Missing parameters') });
  }
  try {
    const amount = 0.00000546; // Update this magic number.
    let fee = 0;
    await btcClient('importaddress', [didCreator]);
    await btcClient('importaddress', [didUpdater]);
    const unspents = (
      await btcClient('listunspent', [1, 9999999, [didCreator]])
    ).result;
    if (unspents.length) {
      const inputs = [];
      const outputs = {};
      fee = helpers.calculateFee(unspents.length, 3); // Update this magic number.
      let totalAmount = 0;
      unspents.forEach((x) => {
        inputs.push({ txid: x.txid, vout: x.vout });
        totalAmount += x.amount;
      });
      if (totalAmount >= Number(amount) + Number(fee)) {
        const changeAmt = (
          totalAmount - (Number(amount) + Number(fee))
        ).toFixed(8);
        outputs[didUpdater] = Number(amount);
        if (Number(changeAmt) > 0) {
          outputs[didCreator] = changeAmt;
        }
        // outputs.data = OP_RETURN;
        const rawTx = await btcClient('createrawtransaction', [
          inputs,
          outputs,
        ]);
        if (rawTx.result) {
          return res.status(200).send({
            message: 'Tx created successfully.',
            result: rawTx.result,
            error: null,
          });
        }
        return res.status(500).send({
          result: null,
          error: i18n('Error occurred while creating a raw transaction.'),
        });
      }
      return res.status(500).send({
        result: null,
        error: i18n('Sender does not have sufficient balance.'),
      });
    }
    fee = helpers.calculateFee(1, 2); // Update this magic number.
    return res.status(500).send({
      result: null,
      error: i18n(
        `Sender does not have funds. Please fund this address "${didCreator}" with ${fee} BTC.`,
      ),
    });
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

node.post('/signTx', async (req, res) => {
  try {
    const { rawTx, privKey } = req.body;
    if (!rawTx || !privKey) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const signedTx = await btcClient('signrawtransactionwithkey', [
      rawTx,
      [privKey],
    ]);
    if (signedTx.result && signedTx.result.complete) {
      return res.status(400).send({
        result: signedTx.result.hex,
        message: 'Tx signed successfully.',
        error: null,
      });
    }
    return {
      result: null,
      error: i18n('Error in signing transaction'),
    };
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

node.post('/createNewDID', async (req, res) => {
  try {
    const { signedTx } = req.body;
    if (!signedTx) {
      return res
        .status(400)
        .send({ result: null, error: i18n('Missing parameters') });
    }
    const sentTx = await btcClient('sendrawtransaction', [signedTx]);
    return {
      error: null,
      message: 'Txn sent successfully.',
      result: sentTx.result,
    };
  } catch (errorT) {
    return res.status(500).send({ result: false, error: errorT.message });
  }
});

const Node = exports;
node.use(express.urlencoded({ extended: true }));
node.use(express.json());
// config ipfs router
node.use('/ipfs/', ipfsRouter);
node.use('/ethdid/',ethDIDRouter);

Node.start = () => {
  node.listen(mainnet.apiPort, () => {
    // eslint-disable-next-line no-console
    console.log('MDIP API server is running');
  });
};
