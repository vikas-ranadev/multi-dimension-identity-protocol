const { fromMasterSeed, fromExtendedKey } = require('hdkey');
const { generateMnemonic, mnemonicToSeedSync } = require('bip39');
const assert = require('assert').strict;

const HD = exports;

/**
 * Function to generate 12 words mnemonic
 * @param {number} strength
 * @param {Object} randombytes
 * @returns {string}
 */
HD.generateMnemonic = (strength, randombytes) => generateMnemonic(strength, randombytes);

/**
 * Function to generate seed buffer
 * @param {string} mnemonic
 * @returns {Buffer}
 */
HD.generateSeed = (mnemonic) => mnemonicToSeedSync(mnemonic);

/**
 * Function to obtain xpub and xpriv
 * @param {Buffer} seedBuffer
 * @returns {object}
 */
HD.obtainMasterRoot = (seedBuffer) => {
  assert.strictEqual(
    Buffer.isBuffer(seedBuffer),
    true,
    'seed must be a buffer',
  );
  return fromMasterSeed(seedBuffer);
};

/**
 * Function to obtain child
 * @param {Object} node
 * @param {string} derivationPath
 * @returns {object}
 */
HD.derive = (node, derivationPath) => node.derive(derivationPath);

/**
 * Function to derive hardened child from extended private key
 * @param {string} xpriv Extended private Key
 * @param {number} childIndex Index for which child will be derived
 * @returns {Object}
 */
function getChildByIndex(xpriv, childIndex) {
  const derivedParent = fromExtendedKey(xpriv);
  return derivedParent.deriveChild(childIndex);
}

HD.getChildByIndex = getChildByIndex;
HD.fromMasterSeed = fromMasterSeed;
HD.fromExtendedKey = fromExtendedKey;
