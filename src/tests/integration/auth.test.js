const mongoose = require('mongoose');
const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const { pick } = require('lodash');
const app = require('../../app');
const User = require('../../models/user.model');
const RefreshToken = require('../../models/refreshToken.model');
const { jwt: jwtConfig } = require('../../config/config');
const auth = require('../../middlewares/auth');
const { generateToken } = require('../../utils/auth.util');
const { setupUsers } = require('../fixtures');
const {
  userOne,
  userOneId,
  userOneRefreshToken,
  userOneAccessToken,
} = require('../fixtures/user.fixtures');

describe('Auth Route', () => {
  beforeEach(async () => {
    await setupUsers();
  });

  after(() => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
  });

  const checkTokensInResponse = response => {
    const { accessToken, refreshToken } = response.body;
    expect(accessToken).to.be.ok;
    expect(accessToken).to.have.property('token');
    expect(accessToken).to.have.property('expires');
    expect(refreshToken).to.be.ok;
    expect(refreshToken).to.have.property('token');
    expect(refreshToken).to.have.property('expires');
  };

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
      expect(response.status).to.be.equal(httpStatus.CREATED);
      delete newUser.password;
      expect(response.body.user).to.include(newUser);
      expect(response.body.user).not.to.have.property('password');
      expect(response.body.user).to.have.property('id');
      checkTokensInResponse(response);

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
      checkTokensInResponse(response);

      const dbUser = await User.findById(userOneId);
      expect(response.body.user).to.be.deep.equal(pick(dbUser, ['id', 'email', 'name', 'age']));
    });

    const checkLoginValidationError = async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.BAD_REQUEST);
    };

    it('should return an error if email is missing', async () => {
      delete loginCredentials.email;
      await checkLoginValidationError();
    });

    it('should return an error if password is missing', async () => {
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

    it('should return an error if user with such an email is not found', async () => {
      loginCredentials.email = 'unknownEmail@example.com';
      await checkLoginAttemptError();
    });

    it('should return an error if user password is wrong', async () => {
      loginCredentials.password = 'wrongPassword';
      await checkLoginAttemptError();
    });
  });

  describe('POST /v1/auth/refreshToken', () => {
    let refreshToken;
    let refreshTokenExpires;
    beforeEach(() => {
      refreshToken = userOneRefreshToken;
      refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');
    });

    const exec = async () => {
      return request(app)
        .post('/v1/auth/refreshToken')
        .send({ refreshToken });
    };

    it('should successfully refresh access token for a valid refresh token and delete old one', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      checkTokensInResponse(response);

      const newRefreshToken = await RefreshToken.findOne({
        token: response.body.refreshToken.token,
      });
      expect(newRefreshToken).to.be.ok;
      expect(newRefreshToken.user.toHexString()).to.be.equal(userOneId.toHexString());
      expect(newRefreshToken.blacklisted).to.be.false;

      const oldRefreshToken = await RefreshToken.findOne({ token: refreshToken });
      expect(oldRefreshToken).not.to.be.ok;
    });

    it('should return an error if refresh token is missing', async () => {
      refreshToken = null;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.BAD_REQUEST);
    });

    const checkInvalidRefreshAttempt = async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(response.body.status).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(response.body.error).to.be.equal(httpStatus[httpStatus.UNAUTHORIZED]);
      expect(response.body.message).to.be.equal('Please authenticate');
    };

    it('should return an error if the refresh token is signed by an invalid secret', async () => {
      refreshToken = generateToken(userOneId, refreshTokenExpires, 'invalidSecret');
      await checkInvalidRefreshAttempt();
    });

    it('should return an error if the refresh token is not found', async () => {
      refreshToken = generateToken(userOneId, refreshTokenExpires);
      await checkInvalidRefreshAttempt();
    });

    const insertRefreshToken = async (_id, expires, blacklisted = false) => {
      const refreshTokenObject = {
        token: refreshToken,
        user: _id,
        expires,
        blacklisted,
      };
      await new RefreshToken(refreshTokenObject).save();
    };

    it('should return an error if the refresh token is for another user', async () => {
      const anotherUserId = mongoose.Types.ObjectId();
      refreshToken = generateToken(anotherUserId, refreshTokenExpires);
      await insertRefreshToken(userOneId, refreshTokenExpires);
      await checkInvalidRefreshAttempt();
    });

    it('should return an error if the refresh token is blacklisted', async () => {
      refreshToken = generateToken(userOneId, refreshTokenExpires);
      await insertRefreshToken(userOneId, refreshTokenExpires, true);
      await checkInvalidRefreshAttempt();
    });

    it('should return an error if the refresh token is expired', async () => {
      refreshTokenExpires = refreshTokenExpires.subtract(
        jwtConfig.refreshExpirationDays + 1,
        'days'
      );
      refreshToken = generateToken(userOneId, refreshTokenExpires);
      await insertRefreshToken(userOneId, refreshTokenExpires);
      await checkInvalidRefreshAttempt();
    });

    it('should return an error if user is not found', async () => {
      const anotherUserId = mongoose.Types.ObjectId();
      refreshToken = generateToken(anotherUserId, refreshTokenExpires);
      await insertRefreshToken(anotherUserId, refreshTokenExpires);
      await checkInvalidRefreshAttempt();
    });
  });

  describe('Auth middleware', () => {
    let req;
    let res;
    let nextSpy;
    let accessToken;
    let expires;

    beforeEach(() => {
      res = httpMocks.createResponse();
      nextSpy = sinon.spy();
      accessToken = userOneAccessToken;
      expires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
    });

    const exec = async () => {
      req = httpMocks.createRequest({
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const authMiddleware = auth();
      await authMiddleware(req, res, nextSpy);
    };

    it('should call next with no arguments if valid access token', async () => {
      await exec();
      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.firstCall.args.length).to.be.equal(0);
      expect(req.user).to.be.ok;
      expect(req.user._id).to.deep.equal(userOneId);
    });

    const checkInvalidAuthAttempt = async () => {
      await exec();
      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.firstCall.args.length).to.be.equal(1);
      const nextArg = nextSpy.firstCall.args[0];
      expect(nextArg).to.be.ok;
      expect(nextArg.isBoom).to.be.true;
      const { statusCode, error, message } = nextArg.output.payload;
      expect(statusCode).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(error).to.be.equal(httpStatus[httpStatus.UNAUTHORIZED]);
      expect(message).to.be.equal('Please authenticate');
    };

    it('should call next with an error if token is generated with an invalid secret', async () => {
      accessToken = generateToken(userOneId, expires, 'invalidSecret');
      await checkInvalidAuthAttempt();
    });

    it('should call next with an error if token is expired', async () => {
      const expired = expires.subtract(jwtConfig.accessExpirationMinutes + 1, 'minutes');
      accessToken = generateToken(userOneId, expired);
      await checkInvalidAuthAttempt();
    });

    it('should call next with an error if user is not found', async () => {
      const invalidUserId = mongoose.Types.ObjectId();
      accessToken = generateToken(invalidUserId, expires);
      await checkInvalidAuthAttempt();
    });

    it('should call next with an error if access token is not found in header', async () => {
      accessToken = null;
      await checkInvalidAuthAttempt();
    });

    it('should call next with an error if access token is not a valid jwt', async () => {
      accessToken = 'randomString';
      await checkInvalidAuthAttempt();
    });
  });
});
