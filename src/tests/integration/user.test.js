const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app');
const { User, Task } = require('../../models');
const {
  checkValidationError,
  checkUnauthorizedError,
  checkForbiddenError,
} = require('../../utils/test.util');
const { resetDatabase } = require('../fixtures');
const { userOneAccessToken, userOne, userTwo } = require('../fixtures/user.fixture');

describe('User Route', () => {
  let accessToken;
  let userId;
  beforeEach(async () => {
    await resetDatabase();
    userId = userOne._id.toHexString();
    accessToken = userOneAccessToken;
  });

  const checkAccessRightOnAnotherUser = exec => {
    return it('should return a forbidden error if user is not an admin but is trying to access another user', async () => {
      userId = userTwo._id.toHexString();
      const response = await exec();
      checkForbiddenError(response);
    });
  };

  describe('GET /v1/users/:userId', () => {
    const exec = async () => {
      return request(app)
        .get(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
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

    it('should return error if access token is not valid', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });

    checkAccessRightOnAnotherUser(exec);
  });

  describe('PATCH /v1/users/:userId', () => {
    let updateBody;
    beforeEach(() => {
      updateBody = {};
    });

    const exec = async () => {
      return request(app)
        .patch(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateBody);
    };

    it('should update user if input is correct', async () => {
      updateBody = {
        email: 'valid@example.com',
        password: 'Red123456!',
        name: 'New name',
        age: 23,
      };
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);

      const { password } = updateBody;
      delete updateBody.password;
      expect(response.body).to.include(updateBody);
      expect(response.body).not.to.have.property('password');
      expect(response.body).to.have.property('id');

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).to.be.ok;
      expect(dbUser).to.include(updateBody);
      expect(dbUser.password).not.to.be.equal(password);
    });

    it('should return error if access token is not valid', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });

    checkAccessRightOnAnotherUser(exec);

    it('should return error if no update fields are specified', async () => {
      const response = await exec();
      checkValidationError(response);
    });

    it('should return error if email is invalid', async () => {
      updateBody.email = 'notValid';
      const response = await exec();
      checkValidationError(response);
    });

    it('should return error if password contains the word password', async () => {
      updateBody.email = 'Red1234!password';
      const response = await exec();
      checkValidationError(response);
    });

    it('should return error if password is shorter than 8 characters', async () => {
      updateBody.email = 'Red123!';
      const response = await exec();
      checkValidationError(response);
    });

    it('should return error if age is less than 0', async () => {
      updateBody.age = -1;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if email is duplicate and is not my email', async () => {
      updateBody.email = userTwo.email;
      const response = await exec();
      checkValidationError(response);
    });

    it('should not return an error if email is duplicate but is my email', async () => {
      updateBody.email = userOne.email;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.body.email).to.be.equal(updateBody.email);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    const exec = async () => {
      return request(app)
        .delete(`/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
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

    it('should return error if no access token is provided', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });

    checkAccessRightOnAnotherUser(exec);
  });
});
