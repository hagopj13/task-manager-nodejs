const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app');
const { checkUnauthorizedError } = require('../../utils/test.util');
const { setupUsers } = require('../fixtures');
const { userOneAccessToken, userOne } = require('../fixtures/user.fixtures');

describe('User Route', () => {
  let accessToken;
  beforeEach(async () => {
    await setupUsers();
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

    it('should return user profile if access token is valid', async () => {
      // const response = await exec();
    });

    it('should return error if access token is not valid', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });
  });
});
