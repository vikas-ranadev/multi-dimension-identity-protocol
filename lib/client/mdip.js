const request = require('request');

const client = exports;

// client.connect = ({ url }) => {
//   return
// }

const isJSON = (data) => {
  try {
    JSON.parse(data);
    return true;
  } catch (error) {
    return false;
  }
};

client.call = ({ url, method, params }) => {
  const req = {
    url,
    method,
    body: params,
    json: true,
  };
  return new Promise((resolve, reject) => {
    request(req, (err, httpResponse, result) => {
      if (err) {
        reject(err);
      }
      if (isJSON(result)) {
        const parsedRes = JSON.parse(result);
        if (parsedRes && parsedRes.result) {
          resolve(parsedRes);
        } else {
          reject(parsedRes && parsedRes.error);
        }
      } else {
        reject(err);
      }
    });
  });
};

/** URL is a requirement */
client.createDIDTx = async (mdipUrl, didInputs) => {
  const { blockchain } = didInputs;
  if (blockchain === 'btc') {
    const didTxnObject = await client.call({
      url: `${mdipUrl}/${'createDIDRawTx'}`,
      method: 'POST',
      params: didInputs,
    });
    return didTxnObject.result;
  }
  return null;
};

/** URL is a requirement */
client.signRawTx = async (mdipUrl, rawTx, privateKey) => {
  const signedTx = await client.call({
    url: `${mdipUrl}/${'signTx'}`,
    method: 'POST',
    params: { rawTx, privateKey },
  });
  return signedTx.result;
};

/**
 * Create a new MDIP DID.
 * @param {string} blockchain
 * @param {string} signedTx
 */
client.createNewMdipDID = async (mdipUrl, blockchain, signedTx) => {
  if (blockchain === 'btc') {
    const sentTx = await client.call({
      url: `${mdipUrl}/${'createNewDID'}`,
      method: 'POST',
      params: { signedTx },
    });
    /** TODO add bip136 here and add mechanism to wait for 1 confirmation. */
    return `did:mdip:btc-${sentTx.txHash}`;
  }
  return null;
};
