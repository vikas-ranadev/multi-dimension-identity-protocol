
const ipfsAPI = require('ipfs-http-client');
const env = require('../utils/env.json')

async function download(req, res) {
    let cid = req.query.hash;
    res.send(env.gateway+cid);

}


module.exports = {
    download
}