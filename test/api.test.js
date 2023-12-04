const request = require('supertest');
const express = require('express');
const daemonRouter = require('../lib/node/api.routes');
const util = require('../lib/utils/util');

const app = express();
app.use('/', daemonRouter);

jest.mock('../lib/utils/util', () => ({
  checkConnections: jest.fn(),
  btcClient: jest.fn(),
}));

describe('GET /getuptime', () => {
  it('responds with uptime', async () => {
    const response = await request(app).get('/getuptime');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('uptime');
    expect(Number.isInteger(response.body.uptime)).toBeTruthy();
    expect(response.body.uptime).toBeGreaterThan(0);
  });
});

describe('GET /serverinfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds with serverinfo', async () => {
    const mockServerInfo = { info: 'mock info' };
    util.checkConnections.mockResolvedValue(mockServerInfo);

    const response = await request(app).get('/serverinfo');

    expect(response.statusCode).toBe(200);
    expect(util.checkConnections).toHaveBeenCalled();
    expect(response.body.error).toBeNull();
    expect(response.body.result).toEqual(mockServerInfo);
  });

  it('responds with an error when checkConnections fails', async () => {
    const mockError = new Error('mock error');
    util.checkConnections.mockRejectedValue(mockError);

    const response = await request(app).get('/serverinfo');

    expect(response.statusCode).toBe(500);
    expect(util.checkConnections).toHaveBeenCalled();
    expect(response.body.error).toEqual(mockError.message);
    expect(response.body.result).toBeNull();
  });
});

describe('GET /testmempoolaccept', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds with error message when mempool rejects the transaction', async () => {
    const mockResult = [
      {
        txid: 'a1d57555d2fb51f0b22c482c525b3d39702ba80db9f802e3f03cd54030da6167',
        wtxid: 'a1d57555d2fb51f0b22c482c525b3d39702ba80db9f802e3f03cd54030da6167',
        allowed: false,
        'reject-reason': 'missing-inputs',
      },
    ];

    util.btcClient.mockResolvedValue({ result: mockResult });

    const response = await request(app).get('/testmempoolaccept').query({ signedTx: 'mock-signed-tx' });

    expect(response.statusCode).toBe(500);
    expect(response.body.error).toEqual('missing-inputs');
    expect(response.body.result).toBeNull();
  });

  it('responds with success message when mempool accepts the transaction', async () => {
    const mockResult = [
      {
        txid: 'a1d57555d2fb51f0b22c482c525b3d39702ba80db9f802e3f03cd54030da6167',
        wtxid: 'a1d57555d2fb51f0b22c482c525b3d39702ba80db9f802e3f03cd54030da6167',
        allowed: true,
      },
    ];

    util.btcClient.mockResolvedValue({ result: mockResult });

    const response = await request(app).get('/testmempoolaccept').query({ signedTx: 'mock-signed-tx' });

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBeNull();
    expect(response.body.result).toEqual(mockResult[0]);
  });
});

describe('GET /gettransactionhistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTxns = [
    {
      txid: '7cee3498861d27f2daf4c7d0087cd27e45e089fc8641def0346b78ca58403390',
      hash: '055407dfbc7eb339e521eaebfb4d424edea3b821215c90100101c50cdb4a2ab7',
      version: 2,
      size: 451,
      vsize: 289,
      weight: 1156,
      locktime: 0,
      vin: [
        {
          txid: '26cd8d176b8ef222eae481436429e7d1d8442cc7508b564c1c24b9608192eaf1',
          vout: 1,
          scriptSig: {
            asm: '',
            hex: '',
          },
          txinwitness: [
            '304402201ba0dd1283bec2db8fd40102677218257df211c68250739066e663d6f3ab590802202ae3359121254645fa03efcb49bafa77a4f90452b0a217f1cbf88f5058524acf01',
            '03fe36d36dfaf65c67bd190203017b712e96da3f7fe8c32a4bb012f991d92ad85e',
          ],
          sequence: 4294967295,
        },
        {
          txid: 'fc229323b639582ec243f4b72f0b2159d0020413913ecaca99c6028640d80971',
          vout: 2,
          scriptSig: {
            asm: '',
            hex: '',
          },
          txinwitness: [
            '304402200d0256445b0ea332130a1a7f839d9a4e3b2b62177106a7a98454dcda7b942dce0220302127034d31eba9e3738f8af76644a5f6e8308e3a6f14381c8c153abe78cb0f01',
            '02036ba238bf89519614618b746d6c56fccb2521b7c10b0950bcce241ae9305b33',
          ],
          sequence: 4294967295,
        },
      ],
      vout: [
        {
          value: 0.00000000,
          n: 0,
          scriptPubKey: {
            asm: 'OP_RETURN 516d5971794e757071624b6462796f4754775a6f525234635152646a78506d5472434e793261427476476b6d57733a3a4d53694c35557875465438376d4b47314b6d4c683469',
            hex: '6a46516d5971794e757071624b6462796f4754775a6f525234635152646a78506d5472434e793261427476476b6d57733a3a4d53694c35557875465438376d4b47314b6d4c683469',
            type: 'nulldata',
          },
        },
        {
          value: 0.00001111,
          n: 1,
          scriptPubKey: {
            asm: '0 0a8d681b6ddd752fda220e7f8402f7f942a41905',
            hex: '00140a8d681b6ddd752fda220e7f8402f7f942a41905',
            address: 'bc1qp2xksxmdm46jlk3zpelcgqhhl9p2gxg9ux036z',
            type: 'witness_v0_keyhash',
          },
        },
        {
          value: 0.00070758,
          n: 2,
          scriptPubKey: {
            asm: '0 9f9dac5d7616348b18e20cbe2ae954c00ec3cae5',
            hex: '00149f9dac5d7616348b18e20cbe2ae954c00ec3cae5',
            address: 'bc1qn7w6chtkzc6gkx8zpjlz4625cq8v8jh9w99su9',
            type: 'witness_v0_keyhash',
          },
        },
      ],
      hex: '020000000001027109d8408602c699caca3e91130402d059210b2fb7f443c22e5839b6239322fc0100000000ffffffff7109d8408602c699caca3e91130402d059210b2fb7f443c22e5839b6239322fc0200000000ffffffff030000000000000000486a46516d5971794e757071624b6462796f4754775a6f525234635152646a78506d5472434e793261427476476b6d57733a3a4d53694c35557875465438376d4b47314b6d4c68346957040000000000001600140a8d681b6ddd752fda220e7f8402f7f942a4190566140100000000001600149f9dac5d7616348b18e20cbe2ae954c00ec3cae50247304402201ba0dd1283bec2db8fd40102677218257df211c68250739066e663d6f3ab590802202ae3359121254645fa03efcb49bafa77a4f90452b0a217f1cbf88f5058524acf012103fe36d36dfaf65c67bd190203017b712e96da3f7fe8c32a4bb012f991d92ad85e0247304402200d0256445b0ea332130a1a7f839d9a4e3b2b62177106a7a98454dcda7b942dce0220302127034d31eba9e3738f8af76644a5f6e8308e3a6f14381c8c153abe78cb0f012102036ba238bf89519614618b746d6c56fccb2521b7c10b0950bcce241ae9305b3300000000',
      blockhash: '000000000000000000018de85958c6e54de568c00fc5a5ee69996fc928859636',
      confirmations: 3557,
      time: 1699660989,
      blocktime: 1699660989,
    },
    {
      txid: '26cd8d176b8ef222eae481436429e7d1d8442cc7508b564c1c24b9608192eaf1',
      hash: '2ff0f27427aa41680c64746d0ebb0db05fec7fc07e40c15e8d30b3906b5aa0fc',
      version: 2,
      size: 451,
      vsize: 289,
      weight: 1156,
      locktime: 0,
      vin: [
        {
          txid: '5e7997bc52587b24c7864b3aff8d185a156676117735bd3a7e87aecc42668c8a',
          vout: 1,
          scriptSig: {
            asm: '',
            hex: '',
          },
          txinwitness: [
            '30440220261fbeef5dfe439e6834a8a2b2414f40a6a7fef917c8bbce88f7e0a039ec9cec02200a44abec930c62d556489bd25f554bbbf3bef497048f894941700db2a479ac7701',
            '02afba0e5383105a5695db53b81d704319c5d3ac5f7d2f4ac2bbfffa8ebc78caf5',
          ],
          sequence: 4294967295,
        },
        {
          txid: '5e7997bc52587b24c7864b3aff8d185a156676117735bd3a7e87aecc42668c8a',
          vout: 2,
          scriptSig: {
            asm: '',
            hex: '',
          },
          txinwitness: [
            '30440220208f2ebae1e96beb3fbdeaf677be26ae8c5158616f49f7f46e36618884afceba022051cee980135660f736ebb4f14153d3de14630cbb1fc7178131f6afad8da1a37501',
            '02e6c8dec746ba5d9937a35b947c8ebf6a5f80de9c6ab503036d3a19a9556cfaa5',
          ],
          sequence: 4294967295,
        },
      ],
      vout: [
        {
          value: 0.00000000,
          n: 0,
          scriptPubKey: {
            asm: 'OP_RETURN 516d5169717865364466676d4e6a314a546537586b326856516b6745716d4d6a527936747566667163544c4a61423a3a544e7731445a3342705a5a366444563455724a464b5a',
            hex: '6a46516d5169717865364466676d4e6a314a546537586b326856516b6745716d4d6a527936747566667163544c4a61423a3a544e7731445a3342705a5a366444563455724a464b5a',
            type: 'nulldata',
          },
        },
        {
          value: 0.00001111,
          n: 1,
          scriptPubKey: {
            asm: '0 bd85050aeae8d6a7731d0d1ffe612b0cc0f725ca',
            hex: '0014bd85050aeae8d6a7731d0d1ffe612b0cc0f725ca',
            address: 'bc1qhkzs2zh2art2wucap50lucftpnq0wfw2swd3wy',
            type: 'witness_v0_keyhash',
          },
        },
        {
          value: 0.00005888,
          n: 2,
          scriptPubKey: {
            asm: '0 e9f689445c8afe43a8f6c3fd3d2afffb071269d5',
            hex: '0014e9f689445c8afe43a8f6c3fd3d2afffb071269d5',
            address: 'bc1qa8mgj3zu3tly828kc07n62hllvr3y6w4ds2ap5',
            type: 'witness_v0_keyhash',
          },
        },
      ],
      hex: '020000000001028a8c6642ccae877e3abd3577117666155a188dff3a4b86c7247b5852bc97795e0100000000ffffffff8a8c6642ccae877e3abd3577117666155a188dff3a4b86c7247b5852bc97795e0200000000ffffffff030000000000000000486a46516d5169717865364466676d4e6a314a546537586b326856516b6745716d4d6a527936747566667163544c4a61423a3a544e7731445a3342705a5a366444563455724a464b5a5704000000000000160014bd85050aeae8d6a7731d0d1ffe612b0cc0f725ca0017000000000000160014e9f689445c8afe43a8f6c3fd3d2afffb071269d5024730440220261fbeef5dfe439e6834a8a2b2414f40a6a7fef917c8bbce88f7e0a039ec9cec02200a44abec930c62d556489bd25f554bbbf3bef497048f894941700db2a479ac77012102afba0e5383105a5695db53b81d704319c5d3ac5f7d2f4ac2bbfffa8ebc78caf5024730440220208f2ebae1e96beb3fbdeaf677be26ae8c5158616f49f7f46e36618884afceba022051cee980135660f736ebb4f14153d3de14630cbb1fc7178131f6afad8da1a375012102e6c8dec746ba5d9937a35b947c8ebf6a5f80de9c6ab503036d3a19a9556cfaa500000000',
      blockhash: '00000000000000000004b944667f4b15849e2f74e791392857babccd7c604056',
      confirmations: 10594,
      time: 1695578499,
      blocktime: 1695578499,
    },
    {
      txid: 'fc229323b639582ec243f4b72f0b2159d0020413913ecaca99c6028640d80971',
      hash: 'dd5b58d436b0607d2a22c659aab9b9681c96c87bbb8e6007263ed7055bd60513',
      version: 2,
      size: 451,
      vsize: 289,
      weight: 1156,
      locktime: 0,
      vin: [
        {
          txid: 'ac343763567657979d4771a08b7469f41355dd9cdcb81ab0242f8409c3dedf2e',
          vout: 1,
          scriptSig: {
            asm: '',
            hex: '',
          },
          txinwitness: [
            '3044022026e07d1aafed38c45b78d9716f74b02010890604ed94b614102e5283109179f8022007e474643a46d3233fb3fe01a224671b8891432a3709e7df339d2b45c2555d7c01',
            '0304bda397e7a294f0cfbede233959213d10967ab84389c732dd110458a6ac43c4',
          ],
          sequence: 4294967295,
        },
        {
          txid: '87eea03b51daba066b7770013330416c42f5c57f196039af92f123d201d5fb36',
          vout: 2,
          scriptSig: {
            asm: '',
            hex: '',
          },
          txinwitness: [
            '30440220496d916144e4d456149f29d17cf847c9eecd62869e8fec21620dcdb294844555022052c0ad99add3392f7cf9b96d14cc4c752195e259edbdfc30f893b6cefe79153401',
            '03986da3314e27e05f46f37928b6d23d90edb68b4b2b6f9bcc49fb028c3abe2f6d',
          ],
          sequence: 4294967295,
        },
      ],
      vout: [
        {
          value: 0.00000000,
          n: 0,
          scriptPubKey: {
            asm: 'OP_RETURN 516d51784c6f4b41456e57426e754438636243514445637874566f53484b324c31636f7a68564170415542384d713a3a476243577164796844737a5864536d6a39566f4d6445',
            hex: '6a46516d51784c6f4b41456e57426e754438636243514445637874566f53484b324c31636f7a68564170415542384d713a3a476243577164796844737a5864536d6a39566f4d6445',
            type: 'nulldata',
          },
        },
        {
          value: 0.00001111,
          n: 1,
          scriptPubKey: {
            asm: '0 675c20ff2da5c5f3b0e88464ac0a827e6cfe92cb',
            hex: '0014675c20ff2da5c5f3b0e88464ac0a827e6cfe92cb',
            address: 'bc1qvawzpled5hzl8v8gs3j2cz5z0ek0ayktzj706f',
            type: 'witness_v0_keyhash',
          },
        },
        {
          value: 0.00090490,
          n: 2,
          scriptPubKey: {
            asm: '0 c640977c7cac22bc024e15b260a4b40347cf9159',
            hex: '0014c640977c7cac22bc024e15b260a4b40347cf9159',
            address: 'bc1qceqfwlru4s3tcqjwzkexpf95qdruly2ezk67zd',
            type: 'witness_v0_keyhash',
          },
        },
      ],
      hex: '020000000001022edfdec309842f24b01ab8dc9cdd5513f469748ba071479d97577656633734ac0100000000ffffffff36fbd501d223f192af3960197fc5f5426c4130330170776b06bada513ba0ee870200000000ffffffff030000000000000000486a46516d51784c6f4b41456e57426e754438636243514445637874566f53484b324c31636f7a68564170415542384d713a3a476243577164796844737a5864536d6a39566f4d64455704000000000000160014675c20ff2da5c5f3b0e88464ac0a827e6cfe92cb7a61010000000000160014c640977c7cac22bc024e15b260a4b40347cf915902473044022026e07d1aafed38c45b78d9716f74b02010890604ed94b614102e5283109179f8022007e474643a46d3233fb3fe01a224671b8891432a3709e7df339d2b45c2555d7c01210304bda397e7a294f0cfbede233959213d10967ab84389c732dd110458a6ac43c4024730440220496d916144e4d456149f29d17cf847c9eecd62869e8fec21620dcdb294844555022052c0ad99add3392f7cf9b96d14cc4c752195e259edbdfc30f893b6cefe791534012103986da3314e27e05f46f37928b6d23d90edb68b4b2b6f9bcc49fb028c3abe2f6d00000000',
      blockhash: '00000000000000000000ffdea0f92da5035d9e9b07f1fb029d62e261baf52636',
      confirmations: 10421,
      time: 1695685379,
      blocktime: 1695685379,
    },
  ];

  it('responds with success message', async () => {
    util.btcClient.mockImplementation((command, ...otherParams) => {
      if (command === 'getaddresstxids') {
        return Promise.resolve({ result: [mockTxns[0].txid] });
      } if (command === 'getaddressmempool') {
        return Promise.resolve({ result: [] });
      } if (command === 'getrawtransaction') {
        const txid = otherParams[0][0];
        return Promise.resolve({ result: mockTxns.find((txn) => txn.txid === txid) });
      } if (command === 'getaddressutxos') {
        return Promise.resolve({
          result: [{ satoshis: 1000 }, { satoshis: 2000 }, { satoshis: 3000 }],
        });
      }
      return Promise.resolve({ result: null });
    });

    const response = await request(app).get('/gettransactionhistory').query({ address: 'mock-address' });

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBeNull();

    const expectedResult = {
      txns: [mockTxns[0]],
      balance: {
        confirmed: 0.00006000,
        unconfirmed: 0,
        total: 0.000060000,
      },
    };

    expect(response.body.result).toEqual(expectedResult);

    const totalIn = mockTxns[1].vout[1].value + mockTxns[2].vout[2].value;
    const totalOut = mockTxns[0].vout[1].value + mockTxns[0].vout[2].value;
    const fee = totalIn - totalOut;

    const txn = response.body.result.txns[0];

    expect(txn.totalInputValue).toEqual(totalIn.toFixed(8));
    expect(txn.totalOutputValue).toEqual(totalOut.toFixed(8));
    expect(txn.fee).toEqual(fee.toFixed(8));
  });
});
