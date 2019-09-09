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
const { checkResponseUser } = require('../utils/checkResponse');
const { clearDatabase } = require('../fixtures');
const {
  userOne,
  userOneAccessToken,
  userTwo,
  adminAccessToken,
  insertAllUsers,
} = require('../fixtures/user.fixture');
const { userOneTasks, insertTask } = require('../fixtures/task.fixture');

describe('User Route', () => {
  let accessToken;
  let userId;
  let reqBody;
  beforeEach(async () => {
    await clearDatabase();
    await insertAllUsers();
  });

  const testMissingAccessToken = exec => {
    return it('should return a 401 error if access token is missing', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });
  };

  const testBodyValidation = (exec, testCases) => {
    return testCases.forEach(({ message, body }) => {
      it(`should return a 400 error if ${message}`, async () => {
        reqBody = body;
        const response = await exec();
        checkValidationError(response);
      });
    });
  };

  const testUserNotFound = exec => {
    return it('should return a 404 if user is not found', async () => {
      accessToken = adminAccessToken;
      userId = mongoose.Types.ObjectId();
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  };

  const testAccessRightOnAnotherUser = exec => {
    return it('should return a 403 error if user is not an admin but is trying to access another user', async () => {
      userId = userTwo._id.toHexString();
      const response = await exec();
      checkForbiddenError(response);
    });
  };

  describe('GET /v1/users/:userId', async () => {
    beforeEach(() => {
      userId = userOne._id.toHexString();
      accessToken = userOneAccessToken;
    });

    const exec = async () => {
      return request(app)
        .get(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    };

    it('should successfully return 200 and user profile if data is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      const dbUser = await User.findById(userOne._id);
      checkResponseUser(response.body, dbUser);
    });

    testMissingAccessToken(exec);

    testUserNotFound(exec);

    testAccessRightOnAnotherUser(exec);
  });

  describe('PATCH /v1/users/:userId', () => {
    beforeEach(() => {
      userId = userOne._id.toHexString();
      accessToken = userOneAccessToken;
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

    it('should successfully update user and return 200 if data is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      delete reqBody.password;
      expect(response.body).to.include(reqBody);

      const dbUser = await User.findById(userId);
      expect(dbUser).to.include(reqBody);
      checkResponseUser(response.body, dbUser);
    });

    it('should encrypt the password before storing', async () => {
      const response = await exec();
      const dbUser = await User.findById(response.body.id);
      expect(dbUser.password).not.to.be.equal(reqBody.password);
    });

    testMissingAccessToken(exec);

    testUserNotFound(exec);

    testAccessRightOnAnotherUser(exec);

    const bodyValidationTestCases = [
      { body: {}, message: 'no update fields are specified' },
      { body: { email: 'notValid' }, message: 'email is invalid' },
      { body: { password: 'myPassword' }, message: 'password contains the word password' },
      { body: { password: 'Red123!' }, message: 'password is shorter than 8 characters' },
      { body: { age: -1 }, message: 'age is less than 0' },
    ];
    testBodyValidation(exec, bodyValidationTestCases);

    it('should return a 401 error if email is duplicate and is not my email', async () => {
      reqBody.email = userTwo.email;
      const response = await exec();
      checkValidationError(response);
    });

    it('should not return a 401 error if email is duplicate but is my email', async () => {
      reqBody = { email: userOne.email };
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.body.email).to.be.equal(reqBody.email);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    beforeEach(() => {
      userId = userOne._id.toHexString();
      accessToken = userOneAccessToken;
    });

    const exec = async () => {
      return request(app)
        .delete(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    };

    it('should successfully delete user and return 204 if data is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).not.to.be.ok;
    });

    it('should remove the tasks of the deleted user', async () => {
      userOneTasks.forEach(async task => {
        await insertTask(task);
      });
      await exec();
      const dbTasks = await Task.find({ owner: userOne._id });
      expect(dbTasks.length).to.be.equal(0);
    });

    testMissingAccessToken(exec);

    testUserNotFound(exec);

    testAccessRightOnAnotherUser(exec);
  });
});
