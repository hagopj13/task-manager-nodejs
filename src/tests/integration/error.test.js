const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app');

describe('Errors', () => {
  describe('Unknown request', () => {
    it('should return 404 for a call to any route that is not known', async () => {
      const response = await request(app)
        .get('/anyLink')
        .send();
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  });
});
