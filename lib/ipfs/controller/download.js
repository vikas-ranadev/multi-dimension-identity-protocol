const env = require('../utils/env.json');

async function download(req, res) {
  const cid = req.query.hash;
  /**
   * returning downloadable url instead of downloading file first from this URL
   *  and then send back to client
   * to be downloaded again
   *  */

  res.send(env.gateway + cid);
}

module.exports = {
  download,
};
