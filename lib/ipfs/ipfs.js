const ipfsAPI = require('ipfs-http-client');
const fs = require('fs');
const env = require('./utils/env.json');
const formidable = require('formidable');

// Connceting to the ipfs network via infura gateway
const ipfs = ipfsAPI({ host: env.IPFS_URL, port: env.IPFS_PORT, protocol: 'https' });

async function upload(req ) {
  const form = new formidable.IncomingForm();
  return new Promise((resolve, reject) => {
  form.parse(req, async (err, fields, files) => {
    const buf = Buffer.from(fs.readFileSync(files.file.path));
    const result = await ipfs.add({ path: files.file.name, content: buf });
    result.cid = result.cid.toString();
    if (err)
    reject({ success: false, data: err })
    else
    resolve({ success: true, data: result });
  });
});
}

async function download(cid) {

  return env.gateway + cid;
}

module.exports = {
  upload,
  download,

};
