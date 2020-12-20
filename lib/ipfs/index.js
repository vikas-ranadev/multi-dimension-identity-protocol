const ipfsAPI = require('ipfs-http-client');
const fs = require('fs');
const formidable = require('formidable');
const env = require('../config/ipfs.env.json');
const { HTTPS } = require('../utils/constants');

// Connceting to the ipfs network.
const ipfs = ipfsAPI({
  host: env.IPFS_URL,
  port: env.IPFS_PORT,
  protocol: HTTPS,
});

/**
 * Method to upload a document on IPFS.
 * @param {Object} req
 * @returns {Object}
 */
exports.upload = async (req) => {
  const form = new formidable.IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      const buf = Buffer.from(fs.readFileSync(files.file.path));
      const result = await ipfs.add({ path: files.file.name, content: buf });
      result.cid = result.cid.toString();
      if (err) reject(new Error(err.message));
      else resolve({ success: true, data: result });
    });
  });
};

/**
 * Method to download an IPFS document.
 * @param {string} cid
 * @returns {string}
 */
exports.download = async (cid) => env.gateway + cid;
