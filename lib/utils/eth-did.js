const assert = require('assert').strict;
const ethUtil = require('ethereumjs-util');
const HD = require('../wallet/hd');

const didUtils = exports;

/**
 * Util to prepare the details object required for eth based DID creation.
 * @param {string} blockchain
 * @param {object} masterRoot
 * @param {number} childIndexes
 * @param {string} network
 */
/** TODO: this prepare method will be generic for all. */
didUtils.prepareDidInputs = (blockchain, masterRoot, childIndexes) => {
  assert.strictEqual(blockchain, 'eth', 'Invalid blockchain value provided.');
  assert.strictEqual(
    typeof masterRoot,
    'object',
    'Invalid single dimension ID provided.',
  );
  assert.strictEqual(
    childIndexes.length > 0,
    true,
    'Invalid childIndexes provided.',
  );
  const coinType = 60;

  const derivationPath = `m/44'/${coinType}'/0'/0`;

  // const addrNode = root.derive("m/44'/60'/0'/0/0"); // line 1

  const singleDimensionID = HD.derive(masterRoot, derivationPath);
  const child1 = childIndexes[0];
  const child2 = childIndexes[1];
  const derivedChild1 = singleDimensionID.deriveChild(child1);
  const derivedChild2 = singleDimensionID.deriveChild(child2);

  const pubKey = ethUtil.privateToPublic(derivedChild1.privateKey);
  const addr = ethUtil.publicToAddress(pubKey).toString('hex');
  const publicAddr1 = ethUtil.toChecksumAddress(`0x${addr}`);

  const obtainedPrivateKey1 = derivedChild1.privateKey.toString('hex');

  const pubKey2 = ethUtil.privateToPublic(derivedChild2.privateKey);
  const addr2 = ethUtil.publicToAddress(pubKey2).toString('hex');
  const publicAddr2 = ethUtil.toChecksumAddress(`0x${addr2}`);
  const obtainedPrivateKey2 = derivedChild2.privateKey.toString('hex');
  return {
    keyPairs: {
      [child1]: {
        publicKey: publicAddr1,
        privateKey: obtainedPrivateKey1,
      },
      [child2]: {
        publicKey: publicAddr2,
        privateKey: obtainedPrivateKey2,
      },
    },
    data: {
      didCreator: publicAddr1,
      didUpdater: publicAddr2,
      blockchain,
    },
  };
};
