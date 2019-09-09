const { expect } = require('chai');
const httpStatus = require('http-status');
const request = require('./request');
const {
  checkUnauthorizedError,
  checkValidationError,
  checkForbiddenError,
} = require('./checkError');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/user.fixture');

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

const testAdminOnlyAccess = getReqConfig => {
  it('should allow access for admins, but deny it for users', async () => {
    const config = getReqConfig();
    if (!config.headers) {
      config.headers = {};
    }
    config.headers.Authorization = `Bearer ${adminAccessToken}`;
    const allowedResponse = await request(config);
    expect(allowedResponse.status).to.be.below(300);

    config.headers.Authorization = `Bearer ${userOneAccessToken}`;
    const deniedResponse = await request(config);
    checkForbiddenError(deniedResponse);
  });
};

const testQueryFilter = (getReqConfig, key, value, originalList) => {
  return it(`should correctly apply filter on ${key} with value ${value}`, async () => {
    const config = getReqConfig();
    if (!config.query) {
      config.query = {};
    }
    config.query[key] = value;
    const response = await request(config);
    expect(response.status).to.be.equal(httpStatus.OK);
    const matchingElems = originalList.filter(elem => elem[key] === value);
    expect(response.data).to.have.lengthOf(matchingElems.length);
    if (response.data.length) {
      expect(response.data[0]).to.have.property(key, value);
    }
  });
};

const sortBy = (key, desc) => {
  return (a, b) => {
    if (a[key] === b[key]) {
      return 0;
    }
    if (a[key] < b[key]) {
      return desc ? 1 : -1;
    }
    return desc ? -1 : 1;
  };
};

const testQuerySort = (getReqConfig, sort, originalList) => {
  let desc = false;
  let sortKey = sort;
  if (sort[0] === '-') {
    desc = true;
    sortKey = sortKey.slice(1);
  }
  return it(`should correctly apply sorting on ${sortKey}`, async () => {
    const config = getReqConfig();
    if (!config.query) {
      config.query = {};
    }
    config.query.sort = sort;
    const response = await request(config);
    expect(response.status).to.be.equal(httpStatus.OK);
    const expectedList = [...originalList].sort(sortBy(sortKey, desc));
    response.data.forEach((responseElem, index) => {
      expect(responseElem.id).to.be.equal(expectedList[index]._id.toHexString());
    });
  });
};

const testQueryLimit = (getReqConfig, limit, originalList) => {
  it('should limit returned elements if limit query param is specified', async () => {
    const config = getReqConfig();
    if (!config.query) {
      config.query = {};
    }
    config.query.limit = limit;
    const response = await request(config);
    expect(response.status).to.be.equal(httpStatus.OK);
    const expectedLength = Math.min(limit, originalList.length);
    expect(response.data).to.have.lengthOf(expectedLength);
  });
};

const testQuerySkip = (getReqConfig, skip, originalList) => {
  it('should skip some elements if skip query param is specified', async () => {
    const config = getReqConfig();
    if (!config.query) {
      config.query = {};
    }
    config.query.skip = skip;
    const response = await request(config);
    expect(response.status).to.be.equal(httpStatus.OK);
    const expectedLength = Math.max(0, originalList.length - skip);
    expect(response.data).to.have.lengthOf(expectedLength);
  });
};

module.exports = {
  testMissingAccessToken,
  testBodyValidation,
  testAdminOnlyAccess,
  testQueryFilter,
  testQuerySort,
  testQueryLimit,
  testQuerySkip,
};
