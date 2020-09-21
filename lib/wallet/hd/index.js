// const wif = require('wif');
// const bech32 = require('bech32');
// const request = require('request');
// const createHash = require('create-hash');
// const { encode, decode } = require('bs58check');
// const { fromMasterSeed, fromExtendedKey } = require('hdkey');
const { generateMnemonic, mnemonicToSeedSync } = require('bip39');

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
HD.generateSeed = () => {
  const mnemonic = generateMnemonic();
  return mnemonicToSeedSync(mnemonic);
};
