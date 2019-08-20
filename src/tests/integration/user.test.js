const mongoose = require('mongoose');
const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app');
const { setupUsers } = require('../fixtures');
const { userOneAccessToken, userOne } = require('../fixtures/user.fixtures');

describe('User Route', () => {
  describe('GET /v1/users/me', () => {
    let accessToken;
    beforeEach(async () => {
      await setupUsers();
      accessToken = userOneAccessToken;
    });

    after(() => {
      mongoose.models = {};
      mongoose.modelSchemas = {};
    });

    const exec = async () => {
      return request(app)
        .get('/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
    };

    it('should successfully return user profile when everything is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      const user = response.body;
      expect(user).to.be.ok;
      expect(user).to.have.property('id', userOne._id.toHexString());
      expect(user).to.have.property('email', userOne.email);
      expect(user).to.have.property('name', userOne.name);
      expect(user).to.have.property('age', 0);
    });

    it('should return error if user does not have valid access token', async () => {
      accessToken = null;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.UNAUTHORIZED);
      const { status, error, message } = response.body;
      expect(status).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(error).to.be.equal(httpStatus[httpStatus.UNAUTHORIZED]);
      expect(message).to.be.equal('Please authenticate');
    });
  });
});
