// eslint-disable-next-line import/no-extraneous-dependencies
require('regenerator-runtime/runtime');
const HD = require('../lib/wallet/hd');

const { prepareInputs } = require('../lib/utils');
const { txrefToTxid } = require('../lib/utils/tx-ref');
const { helpers } = require('../lib/utils/util');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('prepareInputs', () => {
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
          publicKeyHex: null,
          privateKeyHex: null,
        },
        1: {
          publicKey: 'n35xGo2ALWqkaAmCXrLYPkFgGQGuBumNPH',
          privateKey: 'cQZCK7Xbk3uAmuUuhmm9W6cws8jX7LsioUPguXAMUPyT73htJz34',
          publicKeyHex: null,
          privateKeyHex: null,
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

describe('txrefToTxid', () => {
  it('should decode txid from tx-ref', async () => {
    const DID = 'did:mdip:omni-x5d3-cr5q-qqvh-vn5';
    const txRef = DID.split('did:mdip:omni-')[1];
    const network = 'testnet';
    const isOmni = true;
    const finalTxRef = network === 'mainnet' ? `tx1:${txRef}` : `txtest1:${txRef}`;

    const btcClient = async (command) => {
      if (command === 'getblockhash') {
        return Promise.resolve({ result: 'mock-block-hash' });
      }
      if (command === 'getblock') {
        const txns = Array.from({ length: 30 }, (_, index) => `txid-${index}`);
        return Promise.resolve({ result: { tx: txns } });
      }
      return Promise.resolve({ result: null });
    };

    const resp = await txrefToTxid(finalTxRef, btcClient, isOmni);

    expect(resp).toEqual({
      chain: 'testnet',
      txid: 'txid-20',
      utxoIndex: 0,
    });
  });
});

describe('decodeNullDataIPNS', () => {
  it('should throw error on no inputs', () => {
    expect(() => {
      helpers.decodeNullDataIPNS();
    }).toThrowError();
  });

  it('should return null on empty vout', () => {
    const data = helpers.decodeNullDataIPNS([]);
    expect(data).toBeNull();
  });

  it('should return null on vout without nulldata', () => {
    const vout = [
      {
        value: 0.00001111,
        n: 0,
        scriptPubKey: {
          asm: '0 0a8d681b6ddd752fda220e7f8402f7f942a41905',
          hex: '00140a8d681b6ddd752fda220e7f8402f7f942a41905',
          address: 'bc1qp2xksxmdm46jlk3zpelcgqhhl9p2gxg9ux036z',
          type: 'witness_v0_keyhash',
        },
      },
      {
        value: 0.00070758,
        n: 1,
        scriptPubKey: {
          asm: '0 9f9dac5d7616348b18e20cbe2ae954c00ec3cae5',
          hex: '00149f9dac5d7616348b18e20cbe2ae954c00ec3cae5',
          address: 'bc1qn7w6chtkzc6gkx8zpjlz4625cq8v8jh9w99su9',
          type: 'witness_v0_keyhash',
        },
      },
    ];

    const data = helpers.decodeNullDataIPNS(vout);
    expect(data).toBeNull();
  });

  it('should return null on vout with non-IPNS nulldata', () => {
    const vout = [
      {
        value: 0.00000000,
        n: 0,
        scriptPubKey: {
          asm: 'OP_RETURN 516d5971794e757071624b6462796f4754775a6f525234635152646a78506d5472434e793261427476476b6d57733a3a4d53694c35557875465438376d4b47314b6d4c683469',
          hex: '6a46516d5971794e757071624b6462796f4754775a6f525234635152646a78506d5472434e793261427476476b6d57733a3a4d53694c35557875465438376d4b47314b6d4c683469',
          type: 'nulldata',
        },
      },
    ];

    const data = helpers.decodeNullDataIPNS(vout);
    expect(data).toBeNull();
  });

  it('should return IPNS on vout with valid nulldata', () => {
    const vout = [
      {
        value: 0.00000000,
        n: 0,
        scriptPubKey: {
          asm: 'OP_RETURN 516d5971794e757071624b6462796f4754775a6f525234635152646a78506d5472434e793261427476476b6d57733a3a4d53694c35557875465438376d4b47314b6d4c683469',
          hex: '6a46516d5971794e757071624b6462796f4754775a6f525234635152646a78506d5472434e793261427476476b6d57733a3a4d53694c35557875465438376d4b47314b6d4c683469',
          type: 'nulldata',
        },
      },
    ];

    const mockIPNS = '/ipns/mock-ipns';
    const hexdata = Buffer.from(mockIPNS).toString('hex');
    vout[0].scriptPubKey.asm = `OP_RETURN ${hexdata}`;

    const data = helpers.decodeNullDataIPNS(vout);
    expect(data).toEqual(mockIPNS);
  });
});
