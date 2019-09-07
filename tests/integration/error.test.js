const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');

describe('Errors', () => {
  describe('Unknown request', () => {
    it('should return 404 for a call to any route that is not known', async () => {
      const response = await request(app).get('/anyLink');
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  });
});