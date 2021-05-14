require('regenerator-runtime/runtime');
const HD = require('../../lib/wallet/hd');
const { prepareInputs } = require('../../lib/utils');
const {
  prepareTransaction,
  createNewMdipDID,
} = require('../../lib/client/mdip');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('mongoDB DID Integration Tests', () => {
  it('should create MDIP mongoDB DID', async () => {
    const seedBuffer = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seedBuffer);

    const mdipURL = 'http://localhost:7445';
    const privateDB = 'mongodb';
    const childIndexes = [4];
    const network = '';

    const didInputs = await prepareInputs(
      privateDB,
      masterRoot,
      childIndexes,
      network,
    );
    let didTx = await prepareTransaction(mdipURL, didInputs.data);
    didTx = { result: '609a669f0bbdba5cfecd2b3e' };
    const ID = didTx.result;
    const did = await createNewMdipDID(privateDB, network, ID);
    expect(did).toBe('did:mdip:mongodb-609a669f0bbdba5cfecd2b3e');
  });
});
