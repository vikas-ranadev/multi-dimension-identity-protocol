/**
 * Expose all the modules of the MDIProtocol
 *
 * @exports mdip
 * @type {Object}
 */
const wallet = require('./wallet/hd');
const sdk = require('./client/mdip');
const btcDID = require('./utils');

export { wallet, sdk, btcDID };
export default wallet;
/**
 * Method to load modules.
 * @param {String} name
 * @param {String} path
 */

// mdip.define = function define(name, path) {
//   let cache = null;
//   Object.defineProperty(mdip, name, {
//     enumerable: true,
//     get() {
//       if (!cache) {
//         /** This will lazy load the modules. */
//         // eslint-disable-next-line global-require
//         cache = require(path); // eslint-disable-line import/no-dynamic-require
//       }
//       return cache;
//     },
//   });
// };

// clientWallet
// mdip.define('wallet', './wallet/hd');
// mdip.define('sdk', './client/mdip');
// mdip.define('btcDID', './client/utils/btc-did');
