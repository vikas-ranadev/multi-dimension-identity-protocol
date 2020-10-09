const ipfsAPI = require('ipfs-http-client');
const fs = require('fs');
const formidable = require('formidable');
const env = require('../utils/env.json');

// Connceting to the ipfs network via infura gateway
const ipfs = ipfsAPI({ host: env.IPFS_URL, port: env.IPFS_PORT, protocol: 'https' });

async function upload(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    const buf = Buffer.from(fs.readFileSync(files.file.path));
    const result = await ipfs.add({ path: files.file.name, content: buf });
    result.cid = result.cid.toString();
    res.send(result);
  });
}

module.exports = {
  upload,
};
