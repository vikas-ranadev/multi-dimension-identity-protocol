const assert = require('assert').strict;
const { encode } = require('bs58check');
const createHash = require('create-hash');
const wif = require('wif');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const uniq = require('lodash/uniq');
const { privateToPublic, publicToAddress, toChecksumAddress } = require('ethereumjs-util');
const HD = require('../wallet/hd');

const didUtils = exports;

/**
 * Util to prepare the details object required for bct based DID creation.
 * @param {string} blockchain
 * @param {object} masterRoot
 * @param {number} childIndexes
 * @param {string} network
 */
/** TODO: this prepare method will be generic for all.
 * Handle masterRoot object assertion.
 * Change 'blockchain' to some other identifier name so as to accomodate privateDB as well.
 * Change to prepare Inputs.
 * FInd a library that can obtain BTC public and private keys.
 */
didUtils.prepareInputs = async (blockchain, masterRoot, childIndexes, network) => {
  const allowedChains = ['btc', 'eth'];
  const _childIndexes = uniq(childIndexes);
  assert.strictEqual(allowedChains.includes(blockchain), true, 'Invalid blockchain value provided.');
  assert.strictEqual(
    typeof masterRoot,
    'object',
    'Invalid single dimension ID provided.',
  );
  assert.strictEqual(
    _childIndexes.length === 2,
    true,
    'Invalid childIndexes length provided.',
  );
  let _coinType = 0;
  if (blockchain === 'eth') {
    _coinType = 60;
  }
  if (network === 'testnet') {
    _coinType = 1;
  }
  console.log('[check coinType]', _coinType);
  const derivationPath = `m/44'/${_coinType}'/0'/0`;
  const singleDimensionID = HD.derive(masterRoot, derivationPath);
  const preparedInputs = {};
  preparedInputs.keyPairs = {};
  preparedInputs.data = { blockchain, network };
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < _childIndexes.length; i++) {
    const derivedChild = singleDimensionID.deriveChild(_childIndexes[i]);
    let publicKey = null;
    let privateKey = null;
    if (blockchain === 'btc') {
      ({ publicKey, privateKey } = didUtils.getBTCKeypair(blockchain, network, derivedChild));
    }
    if (blockchain === 'eth') {
      ({ publicKey, privateKey } = didUtils.getETHKeypair(derivedChild));
    }
    preparedInputs.keyPairs[_childIndexes[i]] = { publicKey, privateKey };
    if (i === 0) {
      preparedInputs.data.didCreator = publicKey;
    }
    if (i === 1) {
      preparedInputs.data.didUpdater = publicKey;
    }
  }
  return preparedInputs;
};

/**
 * Util to obtain address from public key.
 * @param {*} blockchain
 * @param {*} network
 * @param {*} publicKey
 */
didUtils.convertPubkeyToAddr = (blockchain, network, publicKey) => {
  const sha256 = createHash('sha256').update(publicKey).digest();
  const rmd160 = createHash('rmd160').update(sha256).digest();

  /** TODO */
  const tmpBuffer = Buffer.allocUnsafe(21);
  tmpBuffer.writeUInt8(0x6f, 0);
  rmd160.copy(tmpBuffer, 1);
  const btcAddr = encode(tmpBuffer);
  return btcAddr;
};

/**
 * Util to convert raw private key to proper format.
 * @param {*} blockchain
 * @param {*} network
 * @param {*} privateKey
 */
/** TODO */
didUtils.obtainPrivkeyfromRaw = (blockchain, network, privateKey) => {
  const privKey = Buffer.from(privateKey, 'hex');
  const key = wif.encode(network === 'testnet' ? 239 : 128, privKey, true); // 239 for testent; 128 for mainnet
  return key;
};

/**
 *
 * @param {*} param0
 * @param {*} privKey
 */
didUtils.createAndSignTx = (
  {
    didCreator: creator, didUpdater: updater, blockchain, network,
  },
  { unspents, fee },
  privKey,
) => {
  assert.strictEqual(blockchain, 'btc', 'Invalid blockchain provided.');
  let totalAmount = 0;
  const sendAmt = 0.00000546;
  const nw = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
  const signer = bitcoin.ECPair.fromWIF(privKey, nw);

  const psbt = new bitcoin.Psbt({ network: nw });
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < unspents.length; i++) {
    const {
      txid,
      vout,
      amount,
      rawTx: { hex },
    } = unspents[i];
    totalAmount += amount;
    const isSegwit = hex.substring(8, 12) === '0001';
    console.log('[segwit]', isSegwit);
    psbt.addInput({
      hash: txid,
      index: vout,
      nonWitnessUtxo: Buffer.from(hex, 'hex'),
    });
  }
  psbt.addOutput({
    address: updater,
    value: parseInt(sendAmt * 10 ** 8, 10),
  });
  const change = parseInt((totalAmount - (sendAmt + Number(fee))) * 10 ** 8, 10);
  if (change > 0) {
    psbt.addOutput({
      address: creator,
      value: change,
    });
  }
  psbt.signAllInputs(signer);
  const valid = psbt.validateSignaturesOfAllInputs();
  if (valid) {
    psbt.finalizeAllInputs();
    const txHex = psbt.extractTransaction().toHex();
    return txHex;
  }
  throw new Error('Invalid private key provided.');
};

/**
 * Function to verify a given signature is valid or not.
 * @param {string} message
 * @param {string} publicKey
 * @param {string} signature
 * @returns {boolean}
 */
didUtils.verifySign = (message, publicKey, signature) => {
  const verify = bitcoinMessage.verify(message, publicKey, signature);
  return verify;
};

/**
 * Helper function to obtain a BTC keypair.
 * @param {string} blockchain
 * @param {string} network
 * @param {object} derivedChild
 * @returns {object}
 */
didUtils.getBTCKeypair = (blockchain, network, derivedChild) => {
  const childsPublicAddr = didUtils.convertPubkeyToAddr(
    blockchain,
    network,
    derivedChild.publicKey,
  );
  const childsPrivateKey = didUtils.obtainPrivkeyfromRaw(
    blockchain,
    network,
    derivedChild.privateKey,
  );
  return {
    publicKey: childsPublicAddr,
    privateKey: childsPrivateKey,
  };
};

/**
 * Helper function to obtain a BTC keypair.
 * @param {object} derivedChild
 */
didUtils.getETHKeypair = (derivedChild) => {
  const pubKey = privateToPublic(derivedChild.privateKey);
  const addr = publicToAddress(pubKey).toString('hex');
  const childsPublicAddr = toChecksumAddress(`0x${addr}`);
  const childsPrivateKey = derivedChild.privateKey.toString('hex');
  return {
    publicKey: childsPublicAddr,
    privateKey: childsPrivateKey,
  };
};
