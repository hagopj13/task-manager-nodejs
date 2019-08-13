const mongoose = require('mongoose');
const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const { pick } = require('lodash');
const app = require('../../app');
const User = require('../../models/user.model');
const { setupUsers } = require('../fixtures');
const { userOne } = require('../fixtures/user.fixtures');

describe('Auth Route', () => {
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
      await setupUsers();
    });

    const exec = async () => {
      return request(app)
        .post('/v1/auth/register')
        .send(newUser);
    };

    it('should register new user when request data is ok', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      delete newUser.password;
      expect(response.body.user).to.include(newUser);
      expect(response.body.user).not.to.have.property('password');
      expect(response.body.user).to.have.property('id');

      const dbUser = await User.findById(response.body.user.id);
      expect(dbUser).to.be.ok;
      expect(dbUser.password).not.to.be.equal(newUser.password);
    });

    const checkRegisterValidationError = async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.BAD_REQUEST);
    };

    it('should return an error if email is missing', async () => {
      delete newUser.email;
      await checkRegisterValidationError();
    });

    it('should return an error if email is invalid', async () => {
      newUser.email = 'notvalid';
      await checkRegisterValidationError();
    });

    it('should return an error if email is already used', async () => {
      newUser.email = userOne.email;
      await checkRegisterValidationError();
    });

    it('should return an error if password is missing', async () => {
      delete newUser.password;
      await checkRegisterValidationError();
    });

    it('should return an error if password is contains the word password', async () => {
      newUser.password = 'Red1234!password';
      await checkRegisterValidationError();
    });

    it('should return an error if password is shorter than 8 characters', async () => {
      newUser.password = 'Red1234';
      await checkRegisterValidationError();
    });

    it('should return an error if name is missing', async () => {
      delete newUser.name;
      await checkRegisterValidationError();
    });

    it('should return an error if age is less than 0', async () => {
      newUser.age = -1;
      await checkRegisterValidationError();
    });

    it('should set the age by default to 0 if not given', async () => {
      delete newUser.age;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body.user.age).to.be.equal(0);
    });
  });

  describe('POST /v1/auth/login', () => {
    let loginCredentials;

    beforeEach(() => {
      loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };
    });

    const exec = async () => {
      return request(app)
        .post('/v1/auth/login')
        .send(loginCredentials);
    };

    it('should successfully login user when correct email and password are provided', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);

      const dbUser = await User.findById(userOne._id);
      expect(response.body.user).to.be.deep.equal(pick(dbUser, ['id', 'email', 'name', 'age']));
    });

    const checkLoginValidationError = async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.BAD_REQUEST);
    };

    it('should return a 400 error if email is missing', async () => {
      delete loginCredentials.email;
      await checkLoginValidationError();
    });

    it('should return a 400 error if password is missing', async () => {
      delete loginCredentials.password;
      await checkLoginValidationError();
    });

    const checkLoginAttemptError = async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.UNAUTHORIZED);
      const expectedError = {
        status: httpStatus.UNAUTHORIZED,
        error: httpStatus[httpStatus.UNAUTHORIZED],
        message: 'Incorrect email or password',
      };
      expect(response.body).to.be.deep.equal(expectedError);
    };

    it('should return a 401 error if user with such an email is not found', async () => {
      loginCredentials.email = 'unknownEmail@example.com';
      await checkLoginAttemptError();
    });

    it('should return a 401 error if user password is wrong', async () => {
      loginCredentials.password = 'wrongPassword';
      await checkLoginAttemptError();
    });
  });
});
