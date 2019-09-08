const { expect } = require('chai');

const checkResponseTokens = responseTokens => {
  expect(responseTokens).to.have.property('accessToken');
  expect(responseTokens).to.have.nested.property('accessToken.token');
  expect(responseTokens).to.have.nested.property('accessToken.expires');
  expect(responseTokens).to.have.property('refreshToken');
  expect(responseTokens).to.have.nested.property('refreshToken.token');
  expect(responseTokens).to.have.nested.property('refreshToken.expires');
};

const checkResponseUser = (responseUser, dbUser) => {
  expect(responseUser).to.have.property('id');
  expect(responseUser).to.have.property('email');
  expect(responseUser).to.have.property('name');
  expect(responseUser).to.have.property('age');
  expect(responseUser).to.have.property('role');
  expect(responseUser).not.to.have.property('password');

  if (dbUser) {
    expect(responseUser.id).to.be.equal(dbUser._id.toHexString());
    expect(responseUser.email).to.be.equal(dbUser.email);
    expect(responseUser.name).to.be.equal(dbUser.name);
    expect(responseUser.age).to.be.equal(dbUser.age);
    expect(responseUser.role).to.be.equal(dbUser.role);
  }
};

const checkResponseTask = (responseTask, dbTask) => {
  expect(responseTask).to.have.property('id');
  expect(responseTask).to.have.property('description');
  expect(responseTask).to.have.property('completed');
  expect(responseTask).to.have.property('owner');

  if (dbTask) {
    expect(responseTask.id).to.be.equal(dbTask._id.toHexString());
    expect(responseTask.description).to.be.equal(dbTask.description);
    expect(responseTask.completed).to.be.equal(dbTask.completed);
    expect(responseTask.owner).to.be.equal(dbTask.owner.toHexString());
  }
};

module.exports = {
  checkResponseTokens,
  checkResponseUser,
  checkResponseTask,
};
