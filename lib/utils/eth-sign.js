const Web3 = require('web3');

/**
 * Method to sign an ETH transaction.
 * @param {string} privKey
 * @param {string} txObj
 * @param {string} pubKey
 * @returns {Object}
 */
exports.sign = async (privKey, txObj, pubKey) => {
  try {
    const web3 = new Web3(
      new Web3.providers.HttpProvider(txObj.result.provider),
    );
    web3.eth.accounts.wallet.add(privKey);
    const tx = await web3.eth.accounts.signTransaction(
      {
        from: pubKey,
        gasPrice: txObj.result.gasPrice,
        gas: txObj.result.gasLimit,
        to: txObj.result.contractAddress,
        data: txObj.result.data,
      },
      privKey,
    );
    return { success: true, data: tx };
  } catch (err) {
    return { success: false, data: `${err}` };
  }
};
