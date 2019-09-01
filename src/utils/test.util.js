const { expect } = require('chai');
const httpStatus = require('http-status');

const checkValidationError = response => {
  expect(response.status).to.be.equal(httpStatus.BAD_REQUEST);
  expect(response.body).to.have.property('status', httpStatus.BAD_REQUEST);
  expect(response.body).to.have.property('error', httpStatus[httpStatus.BAD_REQUEST]);
  expect(response.body).to.have.property('message');
};

const checkUnauthorizedError = (response, message = 'Please authenticate') => {
  expect(response.status).to.be.equal(httpStatus.UNAUTHORIZED);
  expect(response.body).to.have.property('status', httpStatus.UNAUTHORIZED);
  expect(response.body).to.have.property('error', httpStatus[httpStatus.UNAUTHORIZED]);
  expect(response.body).to.have.property('message', message);
};

module.exports = {
  checkValidationError,
  checkUnauthorizedError,
};
