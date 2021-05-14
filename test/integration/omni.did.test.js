require('regenerator-runtime/runtime');
const HD = require('../../lib/wallet/hd');
const { prepareInputs } = require('../../lib/utils');
const {
  prepareTransaction,
  getUtxos,
  signTx,
  // eslint-disable-next-line no-unused-vars
  broadcast,
  createNewMdipDID,
} = require('../../lib/client/mdip');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('Omni DID Integration Tests', () => {
  it('should create MDIP Omnilayer DID', async () => {
    const seedBuffer = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seedBuffer);
    const mdipURL = 'http://localhost:7445';
    const blockchain = 'omni';
    const childIndexes = [5, 6];
    const network = 'testnet';
    const didInputs = await prepareInputs(
      blockchain,
      masterRoot,
      childIndexes,
      network,
    );
    const creator = didInputs.keyPairs[5];

    const utxos = await getUtxos(
      mdipURL,
      blockchain,
      network,
      didInputs.data.didCreator,
    );

    didInputs.data.nulldata = 'https://www.urltomydid.doc';
    didInputs.data.bypassDocChecks = true;
    const didTx = await prepareTransaction(mdipURL, didInputs.data, utxos);
    const rawTx = didTx;
    // eslint-disable-next-line no-unused-vars
    const signedTx = await signTx(
      creator.privateKey,
      rawTx,
      creator.publicKey,
      { blockchain, network },
    );
    // const tx = await broadcast(mdipURL, signedTx.data, blockchain);
    const confirmedTx = { result: 'b94154ee3699683f41a29d01b99fb875d289b75a554f9428bfd36c5816bdd178' };
    const did = await createNewMdipDID(blockchain, network, confirmedTx.result, mdipURL);
    expect(did).toBe('did:mdip:omni-x5d3-cr5q-qqvh-vn5');
  }, 60e3);
});
