const { fromMasterSeed, fromExtendedKey } = require('hdkey');
const { generateMnemonic, mnemonicToSeedSync } = require('bip39');
const assert = require('assert').strict;

const HD = exports;

/**
 * Function to generate 12 words mnemonic
 * @returns {string}
 */
HD.generateMnemonic = (strength, randombytes) =>
  generateMnemonic(strength, randombytes);

/**
 * Function to generate seed buffer
 * @returns {Buffer}
 */
HD.generateSeed = (mnemonic) => mnemonicToSeedSync(mnemonic);

/**
 * Function to obtain xpub and xpriv
 * @returns {object}
 */
HD.obtainMasterRoot = (seedBuffer) => {
  /** TODO: Buffer not supported directly in browser. */
  assert.strictEqual(
    Buffer.isBuffer(seedBuffer),
    true,
    'seed must be a buffer'
  );
  return fromMasterSeed(seedBuffer);
};

/**
 * Function to obtain child
 * @returns {object}
 */
HD.derive = (node, derivationPath) => node.derive(derivationPath);

/**
 * Function to derive hardened child from extended private key
 * @param {string} xpriv Extended private Key
 * @param {number} childIndex Index for which child will be derived
 */
function getChildByIndex(xpriv, childIndex) {
  const derivedParent = fromExtendedKey(xpriv);
  return derivedParent.deriveChild(childIndex);
}

HD.getChildByIndex = getChildByIndex;
HD.fromMasterSeed = fromMasterSeed;
HD.fromExtendedKey = fromExtendedKey;
