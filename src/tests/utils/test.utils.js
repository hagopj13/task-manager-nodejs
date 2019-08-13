const { expect } = require('chai');
const httpStatus = require('http-status');

const checkValidationError = response => {
  expect(response.status).to.be.equal(httpStatus.BAD_REQUEST);
  expect(response.body.status).to.be.equal(httpStatus.BAD_REQUEST);
};

module.exports = {
  checkValidationError,
};
