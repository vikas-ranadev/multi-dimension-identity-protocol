const request = require('supertest');
const express = require('express');
const daemonRouter = require('../lib/node/api.routes');

const app = express();
app.use('/', daemonRouter); // assuming your daemonRouter is at '/api' path

describe('GET /getuptime', () => {
  it('responds with uptime', async () => {
    const response = await request(app).get('/getuptime');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('uptime');
    expect(Number.isInteger(response.body.uptime)).toBeTruthy();
    expect(response.body.uptime).toBeGreaterThan(0);
  });
});

