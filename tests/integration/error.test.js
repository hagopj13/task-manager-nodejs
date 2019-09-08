const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');

describe('Errors', () => {
  describe('Unknown request', () => {
    it('should return a 404 error for a call to any route that is not known', async () => {
      const response = await request(app).get('/unknown');
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  });
});
