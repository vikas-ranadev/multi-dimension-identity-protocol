/**
 * Expose all the modules of the MDIProtocol
 *
 * @exports mdip
 * @type {Object}
 */

const mdip = exports;

/**
 * Method to load modules.
 * @param {String} name
 * @param {String} path
 */

mdip.define = function define(name, path) {
  let cache = null;
  Object.defineProperty(mdip, name, {
    enumerable: true,
    get() {
      if (!cache) {
        /** This will lazy load the modules. */
        // eslint-disable-next-line global-require
        cache = require(path); // eslint-disable-line import/no-dynamic-require
      }
      return cache;
    },
  });
};

// clientWallet
mdip.define('wallet', './wallet/hd');
