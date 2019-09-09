const request = require('./request');
const { checkUnauthorizedError, checkValidationError } = require('./checkError');

const testMissingAccessToken = getReqConfig => {
  it('should return a 401 error if access token is missing', async () => {
    const config = getReqConfig();
    if (config.headers) {
      delete config.headers.Authorization;
    }
    const response = await request(config);
    checkUnauthorizedError(response);
  });
};

const testBodyValidation = (getReqConfig, testCases) => {
  return testCases.forEach(({ message, body }) => {
    it(`should return a 400 error if ${message}`, async () => {
      const config = getReqConfig();
      config.body = body;
      const response = await request(config);
      checkValidationError(response);
    });
  });
};

module.exports = {
  testMissingAccessToken,
  testBodyValidation,
};
