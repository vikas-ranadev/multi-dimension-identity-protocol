const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const { ECPairFactory } = require('ecpair');
const ECPair = ECPairFactory(ecc);

const client = require('../lib/client/mdip');
const constants = require('../lib/utils/constants');

function toSats(val) {
    return Math.round(val * 1e8);
}

// utxo copied from https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts
const utxo = {
    txid: '7d067b4a697a09d2c3cff7d4d9506c9955e93bff41bf82d439da7d030382bc3e',
    outputIndex: 0,
    satoshis: 90000,
    rawTx: {
        hex: '0200000001f9f34e95b9d5c8abcd20fc5bd4a825d1517be62f0f775e5f36da944d9' +
            '452e550000000006b483045022100c86e9a111afc90f64b4904bd609e9eaed80d48' +
            'ca17c162b1aca0a788ac3526f002207bb79b60d4fc6526329bf18a77135dc566020' +
            '9e761da46e1c2f1152ec013215801210211755115eabf846720f5cb18f248666fec' +
            '631e5e1e66009ce3710ceea5b1ad13ffffffff01' +
            // value in satoshis (Int64LE) = 0x015f90 = 90000
            '905f010000000000' +
            // scriptPubkey length
            '19' +
            // scriptPubkey
            '76a9148bbc95d2709c71607c60ee3f097c1217482f518d88ac' +
            // locktime
            '00000000',
    }
};

const utxoKeys = ECPair.fromWIF('L2uPYXe17xSTqbCjZvL2DsyXPCbXspvcu5mHLDYUgzdUbZGSKrSr');

describe('client.preparePayment', () => {
    it('returns null for ETH chain', async () => {
        const fromAddr = 'mock-from-address';
        const toAddresses = [{ address: 'mock-to-address', amount: 1 }];
        const opts = {
            blockchain: constants.ETH_BLOCKCHAIN,
            network: constants.TESTNET,
            utxoData: {},
        };

        const payment = await client.preparePayment(fromAddr, toAddresses, opts);
        expect(payment).toEqual(null);
    });

    it('throws an error when the balance is insufficient', async () => {
        const fromAddr = 'mock-from-address';
        const toAddresses = [{ address: 'mock-to-address', amount: 1 }];
        const opts = {
            blockchain: constants.BTC_BLOCKCHAIN,
            network: constants.TESTNET,
            utxoData: {
                unspents: [{ txid: 'mock-txid', outputIndex: 0, satoshis: 10000000, rawTx: { hex: 'mock-raw-tx' } }],
                fee: 0.0001,
                nulldataFee: 0.0001,
            },
        };

        await expect(client.preparePayment(fromAddr, toAddresses, opts)).rejects.toThrow('Insufficient balance');
    });

    it('returns a valid single-input payment', async () => {

        const targetKeys = ECPair.makeRandom();
        const { address: targetAddress } = bitcoin.payments.p2wpkh({ pubkey: targetKeys.publicKey });
        const changeKeys = ECPair.makeRandom();
        const { address: changeAddress } = bitcoin.payments.p2wpkh({ pubkey: changeKeys.publicKey });

        const amountToSend = 0.0002;
        const txnFee = 0.0001;
        const toAddresses = [{ address: targetAddress, amount: amountToSend }];

        const opts = {
            blockchain: constants.BTC_BLOCKCHAIN,
            network: constants.MAINNET,
            utxoData: {
                unspents: [utxo],
                fee: txnFee,
                nulldataFee: txnFee,
            },
        };

        const psbtHex = await client.preparePayment(changeAddress, toAddresses, opts);
        const psbtBase64 = Buffer.from(psbtHex, 'hex').toString('base64');
        const psbt = bitcoin.Psbt.fromBase64(psbtBase64);

        psbt.signInput(0, utxoKeys);
        psbt.finalizeAllInputs();

        const signedTx = psbt.extractTransaction();

        expect(signedTx.ins.length).toEqual(1);
        expect(signedTx.outs.length).toEqual(2);
        expect(signedTx.outs[0].value).toEqual(toSats(amountToSend));
        expect(signedTx.outs[1].value).toEqual(utxo.satoshis - toSats(amountToSend + txnFee));
    });

    it('throws an error when rawdata is too long', async () => {

        const targetKeys = ECPair.makeRandom();
        const { address: targetAddress } = bitcoin.payments.p2wpkh({ pubkey: targetKeys.publicKey });
        const changeKeys = ECPair.makeRandom();
        const { address: changeAddress } = bitcoin.payments.p2wpkh({ pubkey: changeKeys.publicKey });

        const amountToSend = 0.0002;
        const txnFee = 0.0001;
        const toAddresses = [{ address: targetAddress, amount: amountToSend }];

        const opts = {
            blockchain: constants.BTC_BLOCKCHAIN,
            network: constants.MAINNET,
            utxoData: {
                unspents: [utxo],
                fee: txnFee,
                nulldataFee: txnFee,
            },
            rawdata: 'X'.repeat(200),
        };

        await expect(client.preparePayment(changeAddress, toAddresses, opts)).rejects.toThrow('Error: payment information');
    });
});
