const axios = require('axios');
const eccrypto = require('@toruslabs/eccrypto');
const bitmessage = require('../../../../bitmessage-js/lib');
const { bmClient, request } = require('./util');
const { sendJSONToIPFS } = require('../../../utils/util');

const p2p = exports;

const defaultOpts = {
  mdipUrl: `http://localhost:7445`,
};

const createAddress = (privateKey, transport = 'bm') => {
  let addr;
  if (!privateKey || typeof privateKey !== 'string') {
    throw new Error('Invalid or no private key provided');
  }
  if (transport === 'bm') {
    addr = bitmessage.Address.fromPassphrase(privateKey);
  }
  return addr;
};

const addSubscription = async (
  address,
  transport = 'bm',
  opts = defaultOpts
) => {
  if (!address) {
    throw new Error('Address not provided');
  }
  const url = `${opts.mdipUrl}/p2p/addsubs`;
  const method = 'POST';
  const body = { address, transport };
  const resp = await request(url, method, body);
  console.log('[resp]', resp);
  return resp;
};

// subject formats - Identity declaration, Issue new claim, Issue new presentation
const createBroadcastMsg = async (
  from,
  subject,
  message,
  receiverPubKey,
  transport = 'bm',
  opts = {}
) => {
  // content encryption should be tightly coupled and it should be able to tell if enc content is sent
  const subjects = [
    'Identity declaration',
    'Issue new claim',
    'Issue new presentation',
  ];
  if (!from || !subjects.includes(subject)) {
    throw new Error('Invalid parameters');
  }
  if (
    message &&
    (message.iv || message.ephemPublicKey || message.ciphertext || message.mac)
  ) {
    throw new Error('Unencrypted message expected');
  }
  if (typeof message !== 'string') {
    throw new Error('"message" must be a string');
  }
  if (!receiverPubKey) {
    console.warn(
      'Public key not provided. Data will not be encrypted before broadcasting.'
    );
  }
  let encData;
  if (receiverPubKey) {
    encData = await eccrypto.encrypt(
      Buffer.from(receiverPubKey, 'hex'),
      Buffer.from(message)
    );
  }
  const encDataObj = {
    iv: encData.iv.toString('hex'),
    ephemPublicKey: encData.ephemPublicKey.toString('hex'),
    ciphertext: encData.ciphertext.toString('hex'),
    mac: encData.mac.toString('hex'),
  };
  const CIDObj = await sendJSONToIPFS([encDataObj]);
  console.log('[CIDObj]', CIDObj);
  const payload = {
    cid: CIDObj[0].path,
    url: `https://ipfs.io/ipfs/${CIDObj[0].path}`,
    rawdata: encDataObj,
  };
  console.log('[bmPayload]', payload);
  const encodedBroadcast = await bitmessage.objects.broadcast.encodeAsync({
    ttl: 1800, // move to config later
    from,
    subject,
    message: JSON.stringify(payload),
    skipPow: true,
    encoding: 2, // signifies broadcast type of message. handle this magic no.
  });
  console.log('[final][enc payload]', encodedBroadcast);
  console.log('[final][enc payload]', encodedBroadcast.obj.toString('hex'));
  return encodedBroadcast.obj.toString('hex');
};

const broadcast = async (payload, transport = 'bm', opts = defaultOpts) => {
  if (!payload) {
    throw new Error('Payload not found');
  }
  const url = `${opts.mdipUrl}/p2p/broadcast`;
  const method = 'POST';
  const body = { payload, transport };
  const resp = await request(url, method, body);
  return resp;
};

const fetchBroadcastMessages = async (
  broadcasterAddress,
  receiverPrivateKey,
  transport = 'bm',
  opts = defaultOpts
) => {
  if (!broadcasterAddress) {
    throw new Error('Broadcaster address not found');
  }
  const url = `${opts.mdipUrl}/p2p/fetchbroadcasts`;
  const method = 'POST';
  const body = { broadcasterAddress, transport };
  const resp = await request(url, method, body);
  console.log('[resp]', resp);
  const result = resp.result;
  result.inboxMessages.filter(async (msg) => {
    try {
      const decObj = await eccrypto.decrypt(
        Buffer.from(receiverPrivateKey, 'hex'),
        msg.message
      );
      const decMsg = decObj.toString();
      return decMsg;
    } catch (error) {
      console.log('[fetchBroadcastMessages][check error]', error);
      return false;
    }
  });
  return resp;
};

p2p.createAddress = createAddress;
p2p.addSubscription = addSubscription;
p2p.createBroadcastMsg = createBroadcastMsg;
p2p.broadcast = broadcast;
p2p.fetchBroadcastMessages = fetchBroadcastMessages;
