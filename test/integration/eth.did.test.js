require('regenerator-runtime/runtime');
const HD = require('../../lib/wallet/hd');
const { prepareInputs } = require('../../lib/utils');
const {
  prepareTransaction,
  signTx,
  // eslint-disable-next-line no-unused-vars
  broadcast,
  createNewMdipDID,
} = require('../../lib/client/mdip');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('Ethereum DID Integration Tests', () => {
  it('should create MDIP Ethereum DID', async () => {
    const seedBuffer = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seedBuffer);

    const mdipURL = 'http://localhost:7445';
    const blockchain = 'eth';
    const childIndexes = [2, 3];
    const network = 'testnet';

    const didInputs = await prepareInputs(
      blockchain,
      masterRoot,
      childIndexes,
      network,
    );
    const creator = didInputs.keyPairs[2];

    const didTx = await prepareTransaction(mdipURL, didInputs.data);
    const rawTx = didTx;
    // eslint-disable-next-line no-unused-vars
    const signedTx = await signTx(creator.privateKey, rawTx, creator.publicKey);
    // const tx = await broadcast(mdipURL, signedTx.data, blockchain);
    const tx = {
      blockHash:
        '0xadd76d73e21db68eb08071289bee8f9b38b755eede4e3f045059734322dba9c4',
      blockNumber: 8566458,
      contractAddress: null,
      cumulativeGasUsed: 1401264,
      from: '0x3026cab2e9092eb93c066a1020a2c75cfe4569c3',
      gasUsed: 117419,
      logs: [
        {
          address: '0x0c27eD855e2672fC53316F3E04148c3B226Cd8c7',
          blockHash:
            '0xadd76d73e21db68eb08071289bee8f9b38b755eede4e3f045059734322dba9c4',
          blockNumber: 8566458,
          data:
            '0x5581ca9d9ce064e07840bb32ca82256cceb8036763e81e124183e377760601544f63739434dd6561345a8f1d82abef728a711a430beaff6ddc08942d2a600e81',
          logIndex: 19,
          removed: false,
          topics: [Array],
          transactionHash:
            '0x7fabd24ce4844ff8b9982b19435707d1c6a9c15e99e5482761235536d262cdd2',
          transactionIndex: 15,
          id: 'log_58dbe017',
        },
      ],
      logsBloom:
        '0x00000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000800000000000',
      status: true,
      to: '0x0c27ed855e2672fc53316f3e04148c3b226cd8c7',
      transactionHash:
        '0x7fabd24ce4844ff8b9982b19435707d1c6a9c15e99e5482761235536d262cdd2',
      transactionIndex: 15,
      type: '0x0',
    };
    const did = await createNewMdipDID(blockchain, network, tx);
    expect(did).toBe(
      'did:mdip:eth-0x5581ca9d9ce064e07840bb32ca82256cceb8036763e81e124183e37776060154',
    );
  }, 30e3);
});
