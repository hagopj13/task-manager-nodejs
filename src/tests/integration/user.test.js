const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app');
const User = require('../../models/user.model');
const { checkValidationError, checkUnauthorizedError } = require('../../utils/test.util');
const { resetDatabase } = require('../fixtures');
const { userOneAccessToken, userOne, userTwo } = require('../fixtures/user.fixture');

describe('User Route', () => {
  let accessToken;
  beforeEach(async () => {
    await resetDatabase();
    accessToken = userOneAccessToken;
  });

  describe('GET /v1/users/me', () => {
    const exec = async () => {
      return request(app)
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
    };

    it('should return user profile if access token is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      const user = response.body;
      expect(user).to.be.ok;
      expect(user).to.have.property('id', userOne._id.toHexString());
      expect(user).to.have.property('email', userOne.email);
      expect(user).to.have.property('name', userOne.name);
      expect(user).to.have.property('age', 0);
    });

    it('should return error if access token is not valid', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });
  });

  describe('PATCH /v1/users/me', () => {
    let updateBody;
    beforeEach(() => {
      updateBody = {};
    });

    const exec = async () => {
      return request(app)
        .patch('/v1/users/me')
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

  describe('DELETE /v1/users/me', () => {
    const exec = async () => {
      return request(app)
        .delete('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
    };

    it('should delete user if access token is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).not.to.be.ok;
    });

    it('should return error if no access token is provided', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });
  });
});
