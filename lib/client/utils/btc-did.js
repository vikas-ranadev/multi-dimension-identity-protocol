const assert = require('assert').strict;
const { encode } = require('bs58check');
const createHash = require('create-hash');
const wif = require('wif');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const HD = require('../../wallet/hd');

const didUtils = exports;

/**
 * Util to prepare the details object required for bct based DID creation.
 * @param {string} blockchain
 * @param {object} masterRoot
 * @param {number} childIndexes
 * @param {string} network
 */
/** TODO: this prepare method will be generic for all. */
didUtils.prepareDidInputs = async (blockchain, masterRoot, childIndexes, network) => {
  assert.strictEqual(blockchain, 'btc', 'Invalid blockchain value provided.');
  assert.strictEqual(
    typeof masterRoot,
    'object',
    'Invalid single dimension ID provided.',
  );
  assert.strictEqual(
    childIndexes.length > 0,
    true,
    'Invalid childIndexes provided.',
  );
  let coinType = 0;
  if (network === 'testnet') {
    coinType = 1;
  }
  const derivationPath = `m/44'/${coinType}'/0'/0`;
  const singleDimensionID = HD.derive(masterRoot, derivationPath);
  const child1 = childIndexes[0];
  const child2 = childIndexes[1];
  const derivedChild1 = singleDimensionID.deriveChild(child1);
  const derivedChild2 = singleDimensionID.deriveChild(child2);
  const publicAddr1 = didUtils.convertPubkeyToAddr(
    blockchain,
    network,
    derivedChild1.publicKey,
  );
  const obtainedPrivateKey1 = didUtils.obtainPrivkeyfromRaw(
    blockchain,
    network,
    derivedChild1.privateKey,
  );
  const publicAddr2 = didUtils.convertPubkeyToAddr(
    blockchain,
    network,
    derivedChild2.publicKey,
  );
  const obtainedPrivateKey2 = didUtils.obtainPrivkeyfromRaw(
    blockchain,
    network,
    derivedChild2.privateKey,
  );
  return {
    keyPairs: {
      [child1]: {
        publicKey: publicAddr1,
        privateKey: obtainedPrivateKey1,
      },
      [child2]: {
        publicKey: publicAddr2,
        privateKey: obtainedPrivateKey2,
      },
    },
    data: {
      didCreator: publicAddr1,
      didUpdater: publicAddr2,
      blockchain,
      network,
    },
  };
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
  { didCreator: creator, didUpdater: updater, blockchain, network },
  { unspents, fee },
  privKey,
) => {
  assert.strictEqual(blockchain, 'btc', 'Invalid blockchain provided.');
  let totalAmount = 0;
  const sendAmt = 0.00000546; // satoshis
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
    console.log('segwit', isSegwit);
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

didUtils.verifySign = (message, publicKey, signature) => {
  const verify = bitcoinMessage.verify(message, publicKey, signature);
  return verify;
};
