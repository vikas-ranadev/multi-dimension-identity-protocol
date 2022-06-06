// eslint-disable-next-line import/no-extraneous-dependencies
require('regenerator-runtime/runtime');
const HD = require('../lib/wallet/hd');

const { prepareInputs } = require('../lib/utils');
const { txrefToTxid } = require('../lib/utils/tx-ref');
const { btcClient } = require('../lib/utils/util');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('BTC DID utils module', () => {
  it('should prepare DID inputs for a new DID', async () => {
    const seedBuffer = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seedBuffer);
    const blockchain = 'btc';
    const childIndexes = [0, 1];
    const network = 'testnet';
    const didInputs = await prepareInputs(
      blockchain,
      masterRoot,
      childIndexes,
      network,
    );
    expect(didInputs).toEqual({
      keyPairs: {
        0: {
          publicKey: 'mk8upnrspWBXjJBV4o1wJ2Qf5KkhHDrz41',
          privateKey: 'cNGTUehQmpH5g1mYkN9tUahuZAkZGza2YnA8MtGffT2f2VarsaNJ',
        },
        1: {
          publicKey: 'n35xGo2ALWqkaAmCXrLYPkFgGQGuBumNPH',
          privateKey: 'cQZCK7Xbk3uAmuUuhmm9W6cws8jX7LsioUPguXAMUPyT73htJz34',
        },
      },
      data: {
        didCreator: 'mk8upnrspWBXjJBV4o1wJ2Qf5KkhHDrz41',
        didUpdater: 'n35xGo2ALWqkaAmCXrLYPkFgGQGuBumNPH',
        blockchain: 'btc',
        network: 'testnet',
      },
    });
  });

  it('should decode txid from tx-ref', async () => {
    const DID = 'did:mdip:omni-x5d3-cr5q-qqvh-vn5';
    const txRef = DID.split('did:mdip:omni-')[1];
    const network = 'testnet';
    const isOmni = true;
    const finalTxRef = network === 'mainnet' ? `tx1:${txRef}` : `txtest1:${txRef}`;
    const resp = await txrefToTxid(finalTxRef, btcClient, isOmni);
    expect(resp).toEqual({
      chain: 'testnet',
      txid: 'b94154ee3699683f41a29d01b99fb875d289b75a554f9428bfd36c5816bdd178',
      utxoIndex: 0,
    });
  });
});
