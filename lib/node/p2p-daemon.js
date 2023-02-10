const { messages, objects, Address } = require('./bitmessage-js/lib');
const assert = require('assert').strict;
const {
  bmClient,
  sendMessageXMLRequest,
  listAddressesXMLRequest,
  sendBroadcastXMLRequest,
  addSubscriptionXMLRequest,
  getAllInboxMessagesXMLRequest,
} = require('../utils/util');

const P2P = exports;

const createAddress = (privateKey) => {
  if (!privateKey) {
    throw new Error('privateKey is required');
  }
  const addr = Address.fromPassphrase(privateKey);
  return addr.encode();
};

const getNodeAddresses = async (givenBMUrl, givenBMUser, givenBMPass) => {
  const getNodeRequest = listAddressesXMLRequest();
  const addresses = await bmClient(getNodeRequest, givenBMUrl, givenBMUser, givenBMPass);
  console.log('[getNodeRequest]', addresses);
  console.log('[getNodeRequest]', typeof addresses);
  return addresses;
};

const addSubscription = async (address, givenBMUrl, givenBMUser, givenBMPass) => {
  const addSubscriptionReq = addSubscriptionXMLRequest({ address });
  const resp = await bmClient(addSubscriptionReq, givenBMUrl, givenBMUser, givenBMPass);
  console.log('[addSubscription]', resp);
  return resp;
};

const sendMessage = async (
  { toAddress, subject, message },
  givenBMUrl,
  givenBMUser,
  givenBMPass,
) => {
  const nodeAddresses = await getNodeAddresses();
  const fromAddress = nodeAddresses.addresses[0];
  const data = sendMessageXMLRequest({
    toAddress,
    fromAddress,
    subject,
    message,
  });
  console.log('data', data);
  const resp = await bmClient(data, givenBMUrl, givenBMUser, givenBMPass);
  console.log('resp', resp);
};

const sendBroadcast = async ({ subject, message }, givenBMUrl, givenBMUser, givenBMPass) => {
  const nodeAddresses = await getNodeAddresses(givenBMUrl, givenBMUser, givenBMPass);
  const fromAddress = nodeAddresses.addresses[0].address;
  const data = sendBroadcastXMLRequest({
    fromAddress,
    subject,
    message,
    encodingType: '2',
  });
  console.log('data', data);
  const resp = await bmClient(data, givenBMUrl, givenBMUser, givenBMPass);
  console.log('resp', resp);
};

const getAllInboxMessages = async (givenBMUrl, givenBMUser, givenBMPass) => {
  const nodeAddresses = await getNodeAddresses(givenBMUrl, givenBMUser, givenBMPass);
  const data = getAllInboxMessagesXMLRequest(givenBMUrl, givenBMUser, givenBMPass);
  console.log('data', data);
  const resp = await bmClient(data, givenBMUrl, givenBMUser, givenBMPass);
  console.log('resp', resp);
  return resp;
};

P2P.createAddress = createAddress;
P2P.getNodeAddresses = getNodeAddresses;
P2P.addSubscription = addSubscription;
P2P.sendMessage = sendMessage;
P2P.sendBroadcast = sendBroadcast;
P2P.getAllInboxMessages = getAllInboxMessages;

(async () => {
  console.log('[p2p-daemon] init');
  // const broadcastData = { subject: 'Broadcast trial', message: 'Lorem ipsum dolor sit amet' };
  // sendBroadcast(broadcastData);
})();
