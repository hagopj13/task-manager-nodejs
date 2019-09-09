const { expect } = require('chai');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const request = require('../utils/request');
const { User, Task } = require('../../src/models');
const { checkValidationError, checkForbiddenError } = require('../utils/checkError');
const { checkResponseUser } = require('../utils/checkResponse');
const {
  testMissingAccessToken,
  testBodyValidation,
  testAdminOnlyAccess,
  testQueryFilter,
  testQuerySort,
  testQueryLimit,
  testQuerySkip,
} = require('../utils/commonTests');
const { clearDatabase } = require('../fixtures');
const {
  userOne,
  userOneAccessToken,
  userTwo,
  adminAccessToken,
  allUsers,
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

  const testUserNotFound = getReqConfig => {
    return it('should return a 404 if user is not found', async () => {
      accessToken = adminAccessToken;
      userId = mongoose.Types.ObjectId();
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  };

  const testAccessRightOnAnotherUser = getReqConfig => {
    return it('should return a 403 error if user is not an admin but is trying to access another user', async () => {
      userId = userTwo._id.toHexString();
      const response = await request(getReqConfig());
      checkForbiddenError(response);
    });
  };

  describe('GET /v1/users/:userId', async () => {
    beforeEach(() => {
      userId = userOne._id.toHexString();
      accessToken = userOneAccessToken;
    });

    const getReqConfig = () => {
      return {
        method: 'GET',
        url: '/v1/users/:userId',
        params: { userId },
        headers: { Authorization: `Bearer ${accessToken}` },
      };
    };

    it('should successfully return 200 and user profile if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      const dbUser = await User.findById(userOne._id);
      checkResponseUser(response.data, dbUser);
    });

    testMissingAccessToken(getReqConfig);

    testUserNotFound(getReqConfig);

    testAccessRightOnAnotherUser(getReqConfig);
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

    const getReqConfig = () => {
      return {
        method: 'PATCH',
        url: '/v1/users/:userId',
        params: { userId },
        headers: { Authorization: `Bearer ${accessToken}` },
        body: reqBody,
      };
    };

    it('should successfully update user and return 200 if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      delete reqBody.password;
      expect(response.data).to.include(reqBody);

      const dbUser = await User.findById(userId);
      expect(dbUser).to.include(reqBody);
      checkResponseUser(response.data, dbUser);
    });

    it('should encrypt the password before storing', async () => {
      const response = await request(getReqConfig());
      const dbUser = await User.findById(response.data.id);
      expect(dbUser.password).not.to.be.equal(reqBody.password);
    });

    testMissingAccessToken(getReqConfig);

    testUserNotFound(getReqConfig);

    testAccessRightOnAnotherUser(getReqConfig);

    const bodyValidationTestCases = [
      { body: {}, message: 'no update fields are specified' },
      { body: { email: 'notValid' }, message: 'email is invalid' },
      { body: { password: 'myPassword' }, message: 'password contains the word password' },
      { body: { password: 'Red123!' }, message: 'password is shorter than 8 characters' },
      { body: { age: -1 }, message: 'age is less than 0' },
    ];
    testBodyValidation(getReqConfig, bodyValidationTestCases);

    it('should return a 401 error if email is duplicate and is not my email', async () => {
      reqBody.email = userTwo.email;
      const response = await request(getReqConfig());
      checkValidationError(response);
    });

    it('should not return a 401 error if email is duplicate but is my email', async () => {
      reqBody = { email: userOne.email };
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.data.email).to.be.equal(reqBody.email);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    beforeEach(() => {
      userId = userOne._id.toHexString();
      accessToken = userOneAccessToken;
    });

    const getReqConfig = () => {
      return {
        method: 'DELETE',
        url: '/v1/users/:userId',
        params: { userId },
        headers: { Authorization: `Bearer ${accessToken}` },
      };
    };

    it('should successfully delete user and return 204 if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).not.to.be.ok;
    });

    it('should remove the tasks of the deleted user', async () => {
      userOneTasks.forEach(async task => {
        await insertTask(task);
      });
      await request(getReqConfig());
      const dbTasks = await Task.find({ owner: userOne._id });
      expect(dbTasks.length).to.be.equal(0);
    });

    testMissingAccessToken(getReqConfig);

    testUserNotFound(getReqConfig);

    testAccessRightOnAnotherUser(getReqConfig);
  });

  describe('GET /v1/users', async () => {
    let query;
    beforeEach(() => {
      accessToken = adminAccessToken;
      query = {};
    });

    const getReqConfig = () => {
      return {
        method: 'GET',
        url: '/v1/users',
        headers: { Authorization: `Bearer ${accessToken}` },
        query,
      };
    };

    it('should successfully return all the users', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(allUsers.length);
      for (const [index, responseUser] of response.data.entries()) {
        const dbUser = await User.findById(allUsers[index]);
        checkResponseUser(responseUser, dbUser);
      }
    });

    testMissingAccessToken(getReqConfig);
    testAdminOnlyAccess(getReqConfig);

    testQueryFilter(getReqConfig, 'name', userOne.name, allUsers);
    testQueryFilter(getReqConfig, 'role', 'user', allUsers);
    testQuerySort(getReqConfig, '-role', allUsers);
    testQueryLimit(getReqConfig, 1, allUsers);
    testQuerySkip(getReqConfig, 1, allUsers);
  });
});
