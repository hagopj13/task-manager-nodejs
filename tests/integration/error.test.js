const { expect } = require('chai');
const httpStatus = require('http-status');
const request = require('../utils/testRequest');

describe('Errors', () => {
  describe('Unknown request', () => {
    it('should return a 404 error for a call to any route that is not known', async () => {
      const response = await request({ method: 'GET', url: '/unknown' });
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  });
});
