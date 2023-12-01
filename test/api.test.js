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
