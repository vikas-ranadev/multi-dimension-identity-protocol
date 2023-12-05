const request = require('supertest');
const express = require('express');
const daemonRouter = require('../lib/node/api.routes');
const util = require('../lib/utils/util');
const mockTxns = require('./mockTxns');

const app = express();
app.use('/', daemonRouter);

jest.mock('../lib/utils/util', () => ({
  checkConnections: jest.fn(),
  btcClient: jest.fn(),
  helpers: {
    decodeNullDataIPNS: jest.fn(),
  },
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

  it('responds with correct balances given a mock txn', async () => {
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

  it('responds with zero balances given no history', async () => {
    util.btcClient.mockImplementation((command) => {
      if (command === 'getaddresstxids') {
        return Promise.resolve({ result: [] });
      } if (command === 'getaddressmempool') {
        return Promise.resolve({ result: [] });
      } if (command === 'getrawtransaction') {
        return Promise.resolve({ result: null });
      } if (command === 'getaddressutxos') {
        return Promise.resolve({ result: [] });
      }
      return Promise.resolve({ result: null });
    });

    const response = await request(app).get('/gettransactionhistory').query({ address: 'mock-address' });

    const expectedResult = {
      txns: [],
      balance: {
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
      },
    };

    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBeNull();
    expect(response.body.result).toEqual(expectedResult);
  });

  it('responds with error when btcClient fails', async () => {
    util.btcClient.mockImplementation((command) => {
      if (command === 'getaddresstxids') {
        return Promise.resolve({ result: [mockTxns[0]] });
      } if (command === 'getaddressmempool') {
        return Promise.resolve({ result: [] });
      } if (command === 'getrawtransaction') {
        return Promise.resolve({ result: null });
      } if (command === 'getaddressutxos') {
        return Promise.resolve({ result: [] });
      }
      return Promise.resolve({ result: null });
    });

    const response = await request(app).get('/gettransactionhistory').query({ address: 'mock-address' });

    expect(response.statusCode).toBe(500);
    expect(response.body.result).toBeNull();
  });
});

describe('GET /getTxidIPNS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('responds with 400 when no txid provided', async () => {
    const response = await request(app).get('/getTxidIPNS');
    expect(response.statusCode).toBe(400);
  });

  it('responds with 500 when invalid txid provided', async () => {
    const response = await request(app).get('/getTxidIPNS').query({ txid: 'mock-txid' });
    expect(response.statusCode).toBe(500);
  });

  it('responds with success when valid txid provided', async () => {
    const mockTxn = mockTxns[0];
    const mockIPNS = 'mock-ipns';

    util.btcClient.mockResolvedValue({ result: mockTxn });
    util.helpers.decodeNullDataIPNS.mockReturnValue(mockIPNS);

    const response = await request(app).get('/getTxidIPNS').query({ txid: mockTxn.txid });

    expect(response.statusCode).toBe(200);
    expect(response.body.result).toEqual(mockIPNS);
  });
});
