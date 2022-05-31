require('regenerator-runtime/runtime');
const HD = require('../../lib/wallet/hd');
const { prepareInputs } = require('../../lib/utils');
const {
  prepareTransaction,
  getUtxos,
  signTx,
  createNewMdipDID,
} = require('../../lib/client/mdip');

const mnemonic = 'grid bag express ten plate bronze canvas trigger crew olive arrive luggage';

describe('Bitcoin DID Integration Tests', () => {
  it('should create MDIP bitcoin DID', async () => {
    const seedBuffer = HD.generateSeed(mnemonic);
    const masterRoot = HD.obtainMasterRoot(seedBuffer);
    const mdipURL = 'http://localhost:7445';
    const blockchain = 'btc';
    const childIndexes = [0, 1];
    const network = 'testnet';
    const didInputs = await prepareInputs(
      blockchain,
      masterRoot,
      childIndexes,
      network,
    );
    const creator = didInputs.keyPairs[0];

    const utxos = await getUtxos(
      mdipURL,
      blockchain,
      network,
      didInputs.data.didCreator,
    );

    didInputs.data.nulldata = 'https://www.urltomydid.doc';
    didInputs.data.bypassDocChecks = true;
    /** Each of these will have a separate unit test. One assert per test.
     * Unit tests should fail for exactly one reason.
     */
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
    const confirmedTx = { result: '05f35b1d97ad34a51241958ef64f83040bc52fe7f0ede52cf9f251b38803bf4f' };
    const did = await createNewMdipDID(blockchain, network, confirmedTx.result, mdipURL);
    expect(did).toBe('did:mdip:btc-xj83-crjq-q8ff-8g4');
  }, 60e3);
});

/**
 * TODO:
 * Lets have 2 version of this - one where connection to MDIP daemon is required
 * 2nd where connection to MDIP daemon is not required.
 */
