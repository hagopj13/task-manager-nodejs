const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { User, Task } = require('../../src/models');
const {
  checkValidationError,
  checkUnauthorizedError,
  checkForbiddenError,
} = require('../utils/checkError');
const { resetDatabase } = require('../fixtures');
const {
  userOneAccessToken,
  userOne,
  userTwo,
  adminAccessToken,
} = require('../fixtures/user.fixture');

describe('User Route', () => {
  let accessToken;
  let userId;
  let reqBody;
  beforeEach(async () => {
    await resetDatabase();
    userId = userOne._id.toHexString();
    accessToken = userOneAccessToken;
  });

  const testMissingAccessToken = exec => {
    return it('should return a 401 error if access token is missing', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });
  };

  const testBodyValidation = (exec, testCases) => {
    return testCases.forEach(testCase => {
      it(`should return a 400 error if ${testCase.message}`, async () => {
        reqBody = testCase.body;
        const response = await exec();
        checkValidationError(response);
      });
    });
  };

  const checkAccessRightOnAnotherUser = exec => {
    return it('should return a forbidden error if user is not an admin but is trying to access another user', async () => {
      userId = userTwo._id.toHexString();
      const response = await exec();
      checkForbiddenError(response);
    });
  };

  const checkUserNotFound = exec => {
    return it('should return an error if user is not found', async () => {
      accessToken = adminAccessToken;
      userId = mongoose.Types.ObjectId();
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  };

  describe('GET /v1/users/:userId', async () => {
    const exec = async () => {
      return request(app)
        .get(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    };

    const checkUserFormat = (responseUser, expectedUser) => {
      expect(responseUser).to.have.property('id', expectedUser._id.toHexString());
      expect(responseUser).to.have.property('email', expectedUser.email);
      expect(responseUser).to.have.property('name', expectedUser.name);
      expect(responseUser).to.have.property('age', expectedUser.age || 0);
      expect(responseUser).to.have.property('role', expectedUser.role || 'user');
    };

    it('should return user profile if access token is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      checkUserFormat(response.body, userOne);
    });

    testMissingAccessToken(exec);

    checkUserNotFound(exec);

    checkAccessRightOnAnotherUser(exec);
  });

  describe('PATCH /v1/users/:userId', () => {
    beforeEach(() => {
      reqBody = {
        email: 'valid@example.com',
        password: 'Red123456!',
        name: 'New name',
        age: 23,
      };
    });

    const exec = async () => {
      return request(app)
        .patch(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reqBody);
    };

    it('should update user if input is correct', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);

      const { password } = reqBody;
      delete reqBody.password;
      expect(response.body).to.include(reqBody);
      expect(response.body).not.to.have.property('password');
      expect(response.body).to.have.property('id');

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).to.be.ok;
      expect(dbUser).to.include(reqBody);
      expect(dbUser.password).not.to.be.equal(password);
    });

    testMissingAccessToken(exec);

    checkUserNotFound(exec);

    checkAccessRightOnAnotherUser(exec);

    const bodyValidationTestCases = [
      { body: {}, message: 'no update fields are specified' },
      { body: { email: 'notValid' }, message: 'email is invalid' },
      { body: { password: 'myPassword' }, message: 'password contains the word password' },
      { body: { password: 'Red123!' }, message: 'password is shorter than 8 characters' },
      { body: { age: -1 }, message: 'age is less than 0' },
      { body: { email: userTwo.email }, message: 'email is duplicate and is not my email' },
    ];
    testBodyValidation(exec, bodyValidationTestCases);

    it('should not return an error if email is duplicate but is my email', async () => {
      reqBody = { email: userOne.email };
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.body.email).to.be.equal(reqBody.email);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    const exec = async () => {
      return request(app)
        .delete(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    };

    it('should delete user if access token is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).not.to.be.ok;
    });

    it('should remove the tasks of the deleted user', async () => {
      await exec();
      const dbTasks = await Task.find({ owner: userOne._id });
      expect(dbTasks.length).to.be.equal(0);
    });

    testMissingAccessToken(exec);

    checkUserNotFound(exec);

    checkAccessRightOnAnotherUser(exec);
  });
});
