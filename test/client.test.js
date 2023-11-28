const client = require('../lib/client/mdip');
const constants = require('../lib/utils/constants');

describe('client.preparePayment', () => {
    it('throws an error when the balance is insufficient', async () => {
        const fromAddr = 'mock-from-address';
        const toAddresses = [{ address: 'mock-to-address', amount: 1 }];
        const opts = {
            blockchain: constants.BTC_BLOCKCHAIN,
            network: constants.TESTNET,
            utxoData: {
                unspents: [{ txid: 'mock-txid', outputIndex: 0, satoshis: 10000000, rawTx: { hex: 'mock-raw-tx' } }],
                fee: '0.0001',
                nulldataFee: '0.0001',
            },
        };

        await expect(client.preparePayment(fromAddr, toAddresses, opts)).rejects.toThrow('Insufficient balance');
    });
});

