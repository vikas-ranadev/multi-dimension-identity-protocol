const Web3 = require('web3');
// const Tx = require('ethereumjs-tx').Transaction;

async function sign(privKey, txObj, pubKey) {
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
    //     var privateKey = new Buffer(privKey, 'hex')

    // var rawTx = {
    //     from: pubKey,
    //       gasPrice: web3.utils.utf8ToHex(txObj.result.gasPrice),
    //       gas: web3.utils.numberToHex(txObj.result.gasLimit),
    //       to: txObj.result.contractAddress,
    //       data: txObj.result.data,
    //       nonce: 0x0,
    // }

    // var tx = new Tx(rawTx)
    // tx.sign(privateKey);

    // var serializedTx = tx.serialize()
    // console.log(serializedTx.toString('hex'))

    return { success: true, data: tx };
  } catch (err) {
    return { success: false, data: `${err}` };
  }
}

module.exports = {
  sign,
};
