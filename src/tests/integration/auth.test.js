const mongoose = require('mongoose');
const { expect } = require('chai');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user.model');
const { setupUsers } = require('./fixtures');
const { userOne } = require('./fixtures/user.fixtures');

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
        age: 22,
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
      delete newUser.password;
      expect(response.body.user).to.include(newUser);

      const dbUser = await User.findById(response.body.user._id);
      expect(dbUser).to.be.ok;
      expect(dbUser.password).not.to.be.equal(newUser.password);
    });

    it('should return an error if email is missing', async () => {
      delete newUser.email;
      const response = await exec();
      expect(response.status).to.be.equal(400);
    });

    it('should return an error if email is invalid', async () => {
      newUser.email = 'notvalid';
      const response = await exec();
      expect(response.status).to.be.equal(400);
    });

    it('should return an error if email is already used', async () => {
      newUser.email = userOne.email;
      const response = await exec();
      expect(response.status).to.be.equal(400);
    });

    it('should return an error if password is missing', async () => {
      delete newUser.password;
      const response = await exec();
      expect(response.status).to.be.equal(400);
    });

    it('should return an error if password is contains the word password', async () => {
      newUser.password = 'Red1234!password';
      const response = await exec();
      expect(response.status).to.be.equal(400);

      // password shorter than 8 characters
      newUser.password = 'Red1234';
      const response3 = await exec();
      expect(response3.status).to.be.equal(400);
    });

    it('should return an error if password is shorter than 8 characters', async () => {
      newUser.password = 'Red1234';
      const response = await exec();
      expect(response.status).to.be.equal(400);
    });

    it('should return an error if name is missing', async () => {
      delete newUser.name;
      const response = await exec();
      expect(response.status).to.be.equal(400);
    });

    it('should return an error if age is less than 0', async () => {
      newUser.age = -1;
      const response = await exec();
      expect(response.status).to.be.equal(400);
    });

    it('should set the age by default to 0 if not given', async () => {
      delete newUser.age;
      const response = await exec();
      expect(response.status).to.be.equal(201);
      expect(response.body.user.age).to.be.equal(0);
    });
  });
});
