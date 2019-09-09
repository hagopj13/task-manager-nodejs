const { expect } = require('chai');
const httpStatus = require('http-status');

const checkError = (response, status, message) => {
  expect(response.status).to.be.equal(status);
  expect(response.data).to.have.property('status', status);
  expect(response.data).to.have.property('error', httpStatus[status]);
  expect(response.data).to.have.property('message');
  if (message) {
    expect(response.data.message).to.be.equal(message);
  }
};

const checkValidationError = response => {
  checkError(response, httpStatus.BAD_REQUEST);
};

const checkUnauthorizedError = (response, message = 'Please authenticate') => {
  checkError(response, httpStatus.UNAUTHORIZED, message);
};

const checkForbiddenError = response => {
  checkError(response, httpStatus.FORBIDDEN, 'Forbidden');
};

const checkNotFoundError = response => {
  checkError(response, httpStatus.NOT_FOUND);
};

module.exports = {
  checkValidationError,
  checkUnauthorizedError,
  checkForbiddenError,
  checkNotFoundError,
};
