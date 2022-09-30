const { messages } = require('bitmessage');
const { TcpTransport } = require('bitmessage-transports');

const tcp = new TcpTransport({
  dnsSeeds: [['bootstrap8444.bitmessage.org', 8444]],
});

tcp.bootstrap().then((nodes) => {
  console.log('[check nodes]', nodes);
  const remoteHost = nodes[0][0];
  const remotePort = nodes[0][1];
  console.log('Connecting to', nodes[0]);
  tcp.connect(remotePort, remoteHost);
});

tcp.on('established', (version) => {
  console.log('Connection established to', version.userAgent);

  tcp.on('message', (command, payload) => {
    console.log('Got new', command, 'message');
    let decoded;
    if (command === 'addr') {
      decoded = messages.addr.decodePayload(payload);
      console.log('Got', decoded.addrs, 'node addresses');
    }
  });

  tcp.send('sample messsage', (data) => {
    console.log('[check response =>>]', data);
  });
});
