
const ipfsAPI = require('ipfs-http-client');
const fs = require('fs');
const env = require('../utils/env.json')
var formidable = require('formidable');

//Connceting to the ipfs network via infura gateway
const ipfs = ipfsAPI({host:env.IPFS_URL, port:env.IPFS_PORT,protocol: 'https'})

async function upload(req, res) {
  
    var form = new formidable.IncomingForm();
    form.parse(req, async function(err, fields, files) {
        let buf = Buffer.from(fs.readFileSync(files.file.path));
        let result = await ipfs.add({path:files.file.name,content:buf});
        result.cid = result.cid.toString();
        res.send(result);
        
    });
}

module.exports = {
    upload
}