const request = require('../utils/testRequest');
const { checkNotFoundError } = require('../utils/checkError');

describe('Errors', () => {
  describe('Unknown request', () => {
    it('should return a 404 error for a call to any route that is not known', async () => {
      const response = await request({ method: 'GET', url: '/unknown' });
      checkNotFoundError(response);
    });
  });
});
