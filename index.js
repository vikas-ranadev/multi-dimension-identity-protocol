import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { fromMasterSeed, fromExtendedKey } from 'hdkey';
import { encode, decode } from 'bs58check';
import createHash from 'create-hash';
import request from 'request';
import wif from 'wif';
import bech32 from 'bech32';

const btcUser = 'bitcoin';
const btcPass = 'bitcoin';
const btcUrl = 'http://localhost:18332';

let isJSON = (data) => {
  try {
    JSON.parse(data);
    return true;
  } catch (error) {
    return false;
  }
};

let btcClient = (method, params) => {
  let auth = new Buffer(btcUser + ':' + btcPass).toString('base64');

  let url = btcUrl;
  var req = {
    url: url,
    method: 'POST',
    body: JSON.stringify({ jsonrpc: '1.0', id: 'btc', method: method, params: params }),
    headers: { 'Content-Type': 'text/plain', Authorization: 'Basic ' + auth },
  };
  return new Promise((resolve, reject) => {
    request(req, (err, httpResponse, result) => {
      if (err) {
        reject(null);
      }
      if (isJSON(result)) {
        if (JSON.parse(result).result) {
          resolve(JSON.parse(result));
        } else {
          reject(JSON.parse(result).error);
        }
      } else {
        reject(null);
      }
    });
  });
};

const calculateFee = (inputs, outputs) => {
  let feePerByte = 2;
  let txSize = inputs * 180 + outputs * 34 + inputs;
  return (feePerByte * txSize) / Math.pow(10, 8);
};

/**Using xpriv here throughout */
const derivationPath = "m/44'/0'/0'/0";

// const mnemonic = generateMnemonic();
// console.log(mnemonic);
const mnemonic = 'aware acquire nature aware true moon thumb transfer bleak lend win march';
const seedBuffer = mnemonicToSeedSync(mnemonic);

const rootID = fromMasterSeed(seedBuffer);
const rootPublicExtendedKey = rootID.publicExtendedKey;
const rootPrivateExtendedKey = rootID.privateExtendedKey;

const rootNode = fromExtendedKey(rootPrivateExtendedKey);

/**
 * Function to create the DID from extd public key and addrIndex.
 * @param {string} extdPubKey The given extd public key.
 * @param {object} addrIndex the addr index of the derivation path
 * @returns {string}
 */
function createDIDfromExtdPubkey(extdPubKey, addrIndex) {
  return getLeafAddressesFromDerivedPubKey(extdPubKey, addrIndex);
}

/**
 * Only knowing both the parent extended public key and a child private key derived with unhardened derivation exposes the parent private key.
 * Given any private key at m/0/0/i and the xpub at m/0/0, we can drive the private key at m/0/0
 */
/**
 * Function to retrieve the xpriv key from extd public key and an end user private key.
 * @param {string} extdPubKey The given extd public key.
 * @param {object} root root node of the tree
 * @returns {object}
 */
function obtainDIDfromPubkey2(extdPubKey, givenEndUserPrivKey) {
  /**TODO: Now that I have both xpub and a non-hardened child private key, derive xpriv here */
  // return false;
}

/**
 * Function to retrieve the id from extd public key and root node.
 * @param {string} extdPubKey The given extd public key.
 * @param {object} root root node of the tree
 * @returns {object}
 */
function obtainDIDfromPubkey(extdPubKey, root) {}

/**
 * Function to getDerivedRootsPubKey
 * @param {object} root The given public key.
 * @param {string} path The given public key.
 * @returns {string}
 */
function getDerivedRootsPubKey(root, path) {
  const derivedPrivateRoot = root.derive(path);
  return derivedPrivateRoot.publicExtendedKey;
}

/**
 * Function to getLeafAddressesFromDerivedPubKey
 * @param {string} pubkey The given public key.
 * @param {number} givenAddrIndex The given public key.
 * @returns {string}
 */
function getLeafAddressesFromDerivedPubKey(pubkey, givenAddrIndex) {
  const derivedRoot = fromExtendedKey(pubkey);
  const derivedChild = derivedRoot.deriveChild(givenAddrIndex);
  return derivedChild.publicKey.toString('hex');
}

/**
 * Function to getLeafAddressPrivKey
 * @param {object} root The given public key.
 * @param {string} path The given public key.
 * @param {number} givenAddrIndex The given public key.
 * @returns {string}
 */
function getLeafAddressPrivKey(root, path, givenAddrIndex) {
  const userPrivKey = root.derive(`${path}/${givenAddrIndex}`);
  return userPrivKey.privateKey.toString('hex');
}

function util() {
  const rootID = fromMasterSeed(seedBuffer);
  const rootPublicExtendedKey = rootID.publicExtendedKey;
  const rootPrivateExtendedKey = rootID.privateExtendedKey;

  const rootNode = fromExtendedKey(rootPrivateExtendedKey);

  const derivedPubKey = getDerivedRootsPubKey(rootNode, 'm/44/0/0/0');
  const addrIndex = 0;
  const endUserPubKey = getLeafAddressesFromDerivedPubKey(derivedPubKey, addrIndex);
  const endUserPrivKey = getLeafAddressPrivKey(rootNode, 'm/44/0/0/0', addrIndex);
  return { xpub: rootPublicExtendedKey, nhChildPrivateKey: endUserPrivKey };
}

/*********************************************** Progress Day-2 starts below ********************************************************/

const typicalDIDDocument = {
  '@context': ['0', '1'],
  id: 'did:btcr:someTxRef',
  publicKey: [
    {
      id: 'did:btcr:someTxRef#satoshi',
      controller: 'did:btcr:someTxRef',
      type: 'EcdsaSecp256k1VerificationKey2019',
      publicKeyBase58: 'mwkmvuQPVMAbxRwNx5yVahJxQ9sZZCiwuZ',
    },
    {
      id: 'did:btcr:someTxRef#vckey-0',
      controller: 'did:btcr:someTxRef',
      type: 'EcdsaSecp256k1VerificationKey2019',
      publicKeyBase58: 'mwkmvuQPVMAbxRwNx5yVahJxQ9sZZCiwuZ',
    },
  ],
  authentication: ['#satoshi'],
  assertionMethod: ['#vckey-0'],
  service: {
    id: 'did:btcr:someTxRef#CRS',
    type: 'BTCR-CredentialRepositoryService',
    serviceEndpoint: '',
  },
};
// console.log('[Check the hex]', Buffer.from(JSON.stringify(typicalDIDDocument)).toString('hex'));
(async () => {
  const { did } = (await createDIDRefactored(rootNode)) || {};
  console.log('[This is the DID ==>]', did, '\n');
})();

/**
 * Function to convert a given key pair to the DID URL scheme
 * @param {string} rootNodeObj
 * @returns {object}
 */
async function createDIDRefactored(rootNodeObj) {
  /**
   * DID has 3 parts:
   * 1. URL Scheme Identifier
   * 2. DID Method identifier - btcr
   * 3. DID method-specific identifier
   *
   * e.g.: "did:example:somealphanumerictext"
   */
  /**TODO
    Create a DID
      
      A BTCR DID is created by creating a Bitcoin transaction with an optional OP_RETURN data field referring to additional DID document material, as described in this section.

      Abbreviations:        
        Bi = bitcoin address i        
        Pi = public key i        
        Si = signing key i (or private key i)
        
      Creating the initial BTCR DID:        
        1. Create key set (B0/P0/S0)        
        2. Create key set (B1/P1/S1)        
        3. Create Bitcoin transaction:        
            1. Output: Change address B1        
            2. Optional output: OP_RETURN        
            3. Signing key is S0, which reveals public key P0 in the transaction        
        4. Issue TX0 and wait for confirmation. didm-btcr issue 7        
        5. Get TX Ref encoding of the confirmed transaction TxRef(TX0)
        
        At this point we have a DID of the format did:btcr:TxRef(TX0).
   */
  /**The DID method used here is btcr */
  // /**m/ purpose coinType(0 is btc) account-index change-addr-index user-indexes */
  try {
    const didMethod = 'btcr';
    const testnetDerivationPath = "m/44'/1'/0'/0";
    const derivedPubKey = getDerivedRootsPubKey(rootNodeObj, testnetDerivationPath);

    /**Key set 0 */
    const p0 = createDIDfromExtdPubkey(derivedPubKey, 0);
    const s0 = getLeafAddressPrivKey(rootNodeObj, testnetDerivationPath, 0);
    const b0 = createBTCAddr(p0);
    const newS0 = obtainPrivKey(s0);
    console.log('[Addr set 1]', b0, p0, s0, '=>>', newS0);

    /**Key set 1 */
    const p1 = createDIDfromExtdPubkey(derivedPubKey, 1);
    const s1 = getLeafAddressPrivKey(rootNodeObj, testnetDerivationPath, 1);
    const b1 = createBTCAddr(p1);

    const sentTxn = await sendTxn({
      fromAddr: '2MsLS7CGfdsKr6V4FeYUYKpxGcwknzcE4ne',
      toAddr: '2MsZHuFKQMUJFCAa9xfahSC2mAwo88qgVcV',
      privKey: 'cU9nB6PdfuLUGFGsaA3rkSWD44ERkkv76JPRiiD3w8qU1p4YxKgA',
      fee: '0.0001',
      amount: '0',
      /**The below is hex for DID Document which is currently represents a the typicalDIDDocument above this fn */
      OP_RETURN:
        '7b2240636f6e74657874223a5b2230222c2231225d2c226964223a226469643a627463723a736f6d655478526566222c227075626c69634b6579223a5b7b226964223a226469643a627463723a736f6d655478526566237361746f736869222c22636f6e74726f6c6c6572223a226469643a627463723a736f6d655478526566222c2274797065223a224563647361536563703235366b31566572696669636174696f6e4b657932303139222c227075626c69634b6579426173653538223a226d776b6d76755150564d41627852774e7835795661684a785139735a5a436977755a227d2c7b226964223a226469643a627463723a736f6d6554785265662376636b65792d30222c22636f6e74726f6c6c6572223a226469643a627463723a736f6d655478526566222c2274797065223a224563647361536563703235366b31566572696669636174696f6e4b657932303139222c227075626c69634b6579426173653538223a226d776b6d76755150564d41627852774e7835795661684a785139735a5a436977755a227d5d2c2261757468656e7469636174696f6e223a5b22237361746f736869225d2c22617373657274696f6e4d6574686f64223a5b222376636b65792d30225d2c2273657276696365223a7b226964223a226469643a627463723a736f6d65547852656623435253222c2274797065223a22425443522d43726564656e7469616c5265706f7369746f727953657276696365222c2273657276696365456e64706f696e74223a22227d7d',
    });
    console.log('[Check resp]', sentTxn, '\n');
    if (sentTxn && sentTxn.success) {
      const {
        data: {
          txHashObj: { result: txnHash },
        },
      } = sentTxn;
      console.log('[Obtained txn hash is]', txnHash);
      /**Assumption txn is confirmed on the blockchain */
      let tmpTxnHash = 'f3d8db389e242a52889afb1a286cf73434118cab161dcf5545854ca7535960cf';
      /**Remove txtest */
      const didTxRef = bech32.encode('txtest', tmpTxnHash);
      console.log('[DID Part 3]', didTxRef, '\n');
      return { did: `did:${didMethod}:${didTxRef.split('txtest')[1]}`, pubKey: p0, privKey: s0, btcAddr: b0 };
    }
  } catch (errT) {
    console.log('[Error]', errT);
  }
}

/**
 * Create a BTC address from child public key
 * @param {string} pubKey
 * @returns {string}
 */
function createBTCAddr(pubKey) {
  const tmpStore = pubKey;
  const sha256 = createHash('sha256').update(tmpStore).digest();
  const rmd160 = createHash('rmd160').update(sha256).digest();

  const tmpBuffer = Buffer.allocUnsafe(21);
  tmpBuffer.writeUInt8(0x6f, 0);
  rmd160.copy(tmpBuffer, 1);
  const btcAddr = encode(tmpBuffer);
  return btcAddr;
}

/**
 * Create importable private key
 * @param {string} pubKey
 * @returns {string}
 */
function obtainPrivKey(privKey) {
  const privateKey = new Buffer(privKey, 'hex');
  const key = wif.encode(239, privateKey, true); //239 for testent; 128 for mainnet
  return key;
}

/**
 * Create, sign and send a transaction on the BTC testnet
 * @param {object} txnObject
 * @returns {object}
 */
async function sendTxn({ fromAddr, toAddr, amount, fee, privKey, OP_RETURN }) {
  if (!fromAddr || !toAddr || !amount || !fee || !privKey || !OP_RETURN) {
    return { success: false, message: 'Missing parameters' };
  }
  if (isNaN(fee) || (isNaN(fee) && Number(fee) < 0)) {
    return { success: false, message: 'Invalid fee' };
  }
  try {
    // let { fromAddr, toAddr, amount, fee: givenFee, privKey } = req.body;
    let givenFee = fee;
    let decPrivKey = privKey;
    amount = Number(amount);
    let unspents = (await btcClient('listunspent', [1, 9999999, [fromAddr]])).result;
    if (unspents.length) {
      let inputs = [],
        outputs = {},
        totalAmount = 0;
      unspents.forEach((x) => {
        inputs.push({ txid: x.txid, vout: x.vout });
        totalAmount += x.amount;
      });
      // let fee = calculateFee(unspents.length, 2);
      if (totalAmount >= amount + Number(givenFee)) {
        let changeAmt = (totalAmount - (amount + Number(givenFee))).toFixed(8);
        outputs[toAddr] = amount;
        if (Number(changeAmt) > 0) {
          outputs[fromAddr] = changeAmt;
        }
        outputs.data = OP_RETURN;
        let rawTx = await btcClient('createrawtransaction', [inputs, outputs]);
        let signedTx = await btcClient('signrawtransactionwithkey', [rawTx.result, [decPrivKey]]);
        console.log('[Check signed Tx]', signedTx);
        if (signedTx.result && signedTx.result.complete) {
          let sentTx = await btcClient('sendrawtransaction', [signedTx.result.hex]);
          sentTx['sent-amount'] = String(totalAmount);
          sentTx['fee'] = givenFee;
          return { success: true, message: 'Txn sent successfully.', data: { txHashObj: sentTx } };
        } else {
          return {
            success: false,
            message: 'Error in broadcasting Transaction: Transaction signing is not complete. More signatures awaited.',
          };
        }
      } else {
        return { success: false, message: 'Sender does not have sufficient balance.' };
      }
    } else {
      return { success: false, message: 'Sender does not have funds.' };
    }
  } catch (errorT) {
    return { success: false, message: errorT.message };
  }
}
