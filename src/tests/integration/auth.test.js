const mongoose = require('mongoose');
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../app');
const { setupUsers } = require('./fixtures');

describe('Authentication API', () => {
  beforeEach(async () => {
    await setupUsers();
  });

  after(() => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
  });

  describe('POST /v1/auth/register', () => {
    let newUser;
    beforeEach(async () => {
      newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'White1234!',
      };
    });

    const exec = async () => {
      return request(app)
        .post('/v1/auth/register')
        .send(newUser);
    };

    it('should register new user when request data is ok', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(201);
    });
  });
});
