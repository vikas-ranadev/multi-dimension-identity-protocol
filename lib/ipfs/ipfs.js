const ipfsAPI = require('ipfs-http-client');
const fs = require('fs');
const env = require('./utils/env.json');

// Connceting to the ipfs network via infura gateway
const ipfs = ipfsAPI({ host: env.IPFS_URL, port: env.IPFS_PORT, protocol: 'https' });

async function upload(path) {
  const file = fs.readFileSync(path);
  const buf = Buffer.from(file);
  const result = await ipfs.add({ path: file.name, content: buf });
  result.cid = result.cid.toString();
  return result;
}

async function download(cid) {
  /**
   * returning downloadable url instead of downloading file first from this URL
   *  and then send back to client
   * to be downloaded again
   *  */

  return env.gateway + cid;
}

module.exports = {
  upload,
  download,

};
