const assert = require('assert').strict;
const { encode } = require('bs58check');
const createHash = require('create-hash');
const wif = require('wif');
const HD = require('../../wallet/hd');

const didUtils = exports;

/**
 * Util to prepare the details object required for eth based DID creation.
 * @param {string} blockchain
 * @param {object} masterRoot
 * @param {number} childIndexes
 * @param {string} network
 */
/** TODO: this prepare method will be generic for all. */
didUtils.prepareDidInputs = (blockchain, masterRoot, childIndexes, network) => {
  assert.strictEqual(blockchain, 'eth', 'Invalid blockchain value provided.');
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
  let coinType = 60;


  const derivationPath = `m/44'/${coinType}'/0'/0`;

  const addrNode = root.derive("m/44'/60'/0'/0/0"); //line 1
  const pubKey = ethUtil.privateToPublic(addrNode._privateKey);
  const addr = ethUtil.publicToAddress(pubKey).toString('hex');
  const address = ethUtil.toChecksumAddress(addr);

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

  if(blockchain == 'btc'){
      const sha256 = createHash('sha256').update(publicKey).digest();
  const rmd160 = createHash('rmd160').update(sha256).digest();

  /** TODO */
  const tmpBuffer = Buffer.allocUnsafe(21);
  tmpBuffer.writeUInt8(0x6f, 0);
  rmd160.copy(tmpBuffer, 1);
  const btcAddr = encode(tmpBuffer);
  return btcAddr;
  } else if(blockchain == 'eth'){
    const pubKey = ethUtil.privateToPublic(addrNode._privateKey);
  }

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
