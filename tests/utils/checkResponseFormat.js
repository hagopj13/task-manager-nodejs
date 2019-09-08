const { expect } = require('chai');

const checkTokensFormat = responseTokens => {
  expect(responseTokens).to.have.property('accessToken');
  expect(responseTokens).to.have.nested.property('accessToken.token');
  expect(responseTokens).to.have.nested.property('accessToken.expires');
  expect(responseTokens).to.have.property('refreshToken');
  expect(responseTokens).to.have.nested.property('refreshToken.token');
  expect(responseTokens).to.have.nested.property('refreshToken.expires');
};

const checkUserFormat = (responseUser, expectedUser) => {
  expect(responseUser).to.have.property('id');
  if (expectedUser._id) {
    expect(responseUser.id).to.be.equal(expectedUser._id.toHexString());
  }
  expect(responseUser).to.have.property('email', expectedUser.email);
  expect(responseUser).to.have.property('name', expectedUser.name);
  expect(responseUser).to.have.property('age', expectedUser.age || 0);
  expect(responseUser).to.have.property('role', expectedUser.role || 'user');
  expect(responseUser).not.to.have.property('password');
};

const checkTaskFormat = (responseTask, expectedTask) => {
  expect(responseTask).to.have.property('id');
  if (expectedTask._id) {
    expect(responseTask.id).to.be.equal(expectedTask._id.toHexString());
  }
  expect(responseTask).to.have.property('description', expectedTask.description);
  expect(responseTask).to.have.property('completed', expectedTask.completed || false);
  expect(responseTask).to.have.property('owner');
  if (expectedTask.owner) {
    expect(responseTask.owner).to.be.equal(expectedTask.owner.toHexString());
  }
};

module.exports = {
  checkTokensFormat,
  checkUserFormat,
  checkTaskFormat,
};
