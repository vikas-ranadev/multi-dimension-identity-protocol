const request = require('supertest');
const express = require('express');
const daemonRouter = require('../lib/node/api.routes');

const app = express();
app.use('/', daemonRouter);

const util = require('../lib/utils/util');

jest.mock('../lib/utils/util', () => ({
  checkConnections: jest.fn(),
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
