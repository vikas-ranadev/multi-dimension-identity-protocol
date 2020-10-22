const bs58 = require('bs58');
const base58 = require('base58-string');

/**
 * @typedef {Object} Multihash
 * @property {string} digest The digest output of hash function in hex with prepended '0x'
 * @property {number} hashFunction The hash function code for the function used
 * @property {number} size The length of digest
 */

/**
 * Partition multihash string into object representing multihash
 *
 * @param {string} multihash A base58 encoded multihash string
 * @returns {Multihash}
 */
function getBytes32FromMultiash(multihash) {
  const decoded = bs58.decode(multihash);

  return {
    digest: `0x${decoded.slice(2).toString('hex')}`,
    hashFunction: decoded[0],
    size: decoded[1],
  };
}

/**
   * Encode a multihash structure into base58 encoded multihash string
   *
   * @param {Multihash} multihash
   * @returns {(string|null)} base58 encoded multihash string
   */
function getMultihashFromBytes32(multihash) {
  // cut off leading "0x"
  const hashBytes = multihash.slice(2);

  const bf = Buffer.from(`1220${hashBytes}`, 'hex');

  return bs58.encode(bf);
}

module.exports = {
  getBytes32FromMultiash,
  getMultihashFromBytes32,
};
