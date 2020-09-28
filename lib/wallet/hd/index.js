const { fromMasterSeed, fromExtendedKey } = require('hdkey');
const { generateMnemonic, mnemonicToSeedSync } = require('bip39');
const assert = require('assert').strict;

const HD = exports;

/**
 * Function to generate 12 words mnemonic
 * @returns {string}
 */
HD.generateMnemonic = () => generateMnemonic();

/**
 * Function to generate seed buffer
 * @returns {Buffer}
 */
HD.generateSeed = (mnemonic) => mnemonicToSeedSync(mnemonic);

/**
 * Function to obtain xpub and xprv
 * @returns {object}
 */
HD.obtainMasterRoot = (seedBuffer) => {
  /** TODO: Buffer not supported directly in browser. */
  assert.strictEqual(
    Buffer.isBuffer(seedBuffer),
    true,
    'seed must be a buffer',
  );
  return fromMasterSeed(seedBuffer);
};

/**
 * Function to obtain child
 * @returns {object}
 */
HD.deriveChild = (node, derivationPath) => node.derive(derivationPath);

/**
 * Function to getLeafAddressesFromDerivedPubKey
 * @param {string} pubkey The given public key.
 * @param {number} givenAddrIndex The given public key.
 * @returns {string}
 */
function getLeafAddressesFromDerivedPubKey(pubkey, givenAddrIndex) {
  const derivedRoot = fromExtendedKey(pubkey);
  const derivedChild = derivedRoot.deriveChild(givenAddrIndex);
  return derivedChild.publicKey.toString('hex');
}

/**
 * Function to create the DID from extd public key and addrIndex.
 * @param {string} extdPubKey The given extd public key.
 * @param {object} addrIndex the addr index of the derivation path
 * @returns {string}
 */
function createDIDfromExtdPubkey(extdPubKey, addrIndex) {
  return getLeafAddressesFromDerivedPubKey(extdPubKey, addrIndex);
}

/**
 * Function to getDerivedRootsPubKey
 * @param {object} root The given public key.
 * @param {string} path The given public key.
 * @returns {string}
 */
function getDerivedRootsPubKey(root, path) {
  const derivedPrivateRoot = root.derive(path);
  return derivedPrivateRoot.publicExtendedKey;
}

/**
 * Function to getLeafAddressPrivKey
 * @param {object} root The given public key.
 * @param {string} path The given public key.
 * @param {number} givenAddrIndex The given public key.
 * @returns {string}
 */
function getLeafAddressPrivKey(root, path, givenAddrIndex) {
  const userPrivKey = root.derive(`${path}/${givenAddrIndex}`);
  return userPrivKey.privateKey.toString('hex');
}

HD.getDerivedRootsPubKey = getDerivedRootsPubKey;
HD.getLeafAddressPrivKey = getLeafAddressPrivKey;
HD.createDIDfromExtdPubkey = createDIDfromExtdPubkey;
