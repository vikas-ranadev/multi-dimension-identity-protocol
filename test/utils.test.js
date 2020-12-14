// eslint-disable-next-line import/no-extraneous-dependencies
require('regenerator-runtime/runtime');
const HD = require('../lib/wallet/hd');
const btcDIDUtils = require('../lib/utils');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('BTC DID utils module', () => {
  test('Prepare DID inputs for a new DID', async () => {
    const seedBuffer = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seedBuffer);
    const blockchain = 'btc';
    const childIndexes = [0, 1];
    const network = 'testnet';
    const didInputs = await btcDIDUtils.prepareInputs(
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
});
