const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const mongoose = require('mongoose');
const moment = require('moment');
const { pick } = require('lodash');
const app = require('../../src/app');
const { User, RefreshToken } = require('../../src/models');
const { jwt: jwtConfig } = require('../../src/config/config');
const auth = require('../../src/middlewares/auth');
const { generateToken } = require('../../src/utils/auth.util');
const { checkValidationError, checkUnauthorizedError } = require('../utils/checkError');
const { resetDatabase } = require('../fixtures');
const {
  userOne,
  userOneRefreshToken,
  userOneAccessToken,
  adminAccessToken,
} = require('../fixtures/user.fixture');

describe('Auth Route', () => {
  beforeEach(async () => {
    await resetDatabase();
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
    beforeEach(() => {
      newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'White1234!',
        age: 22,
        role: 'user',
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
      const { password } = newUser;
      delete newUser.password;
      expect(response.body.user).to.include(newUser);
      expect(response.body.user).not.to.have.property('password');
      expect(response.body.user).to.have.property('id');
      checkTokensInResponse(response);

      const dbUser = await User.findById(response.body.user.id);
      expect(dbUser).to.be.ok;
      expect(dbUser).to.include(newUser);
      expect(dbUser.password).not.to.be.equal(password);
    });

    it('should return an error if email is missing', async () => {
      delete newUser.email;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if email is invalid', async () => {
      newUser.email = 'notvalid';
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if email is already used', async () => {
      newUser.email = userOne.email;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if password is missing', async () => {
      delete newUser.password;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if password contains the word password', async () => {
      newUser.password = 'Red1234!password';
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if password is shorter than 8 characters', async () => {
      newUser.password = 'Red1234';
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if name is missing', async () => {
      delete newUser.name;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if age is less than 0', async () => {
      newUser.age = -1;
      const response = await exec();
      checkValidationError(response);
    });

    it('should set the age by default to 0 if not given', async () => {
      delete newUser.age;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body.user.age).to.be.equal(0);
    });

    it('should return an error if role is not user or admin', async () => {
      newUser.role = 'invalidRole';
      const response = await exec();
      checkValidationError(response);
    });

    it('should set the role by default to user if not given', async () => {
      delete newUser.role;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body.user.role).to.be.equal('user');
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

      const dbUser = await User.findById(userOne._id);
      expect(response.body.user).to.be.deep.equal(
        pick(dbUser, ['id', 'email', 'name', 'age', 'role'])
      );
    });

    it('should return a 400 error if email is missing', async () => {
      delete loginCredentials.email;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return a 400 error if password is missing', async () => {
      delete loginCredentials.password;
      const response = await exec();
      checkValidationError(response);
    });

    const loginErrorMessage = 'Incorrect email or password';

    it('should return a 401 error if user with such an email is not found', async () => {
      loginCredentials.email = 'unknownEmail@example.com';
      const response = await exec();
      checkUnauthorizedError(response, loginErrorMessage);
    });

    it('should return a 401 error if user password is wrong', async () => {
      loginCredentials.password = 'wrongPassword';
      const response = await exec();
      checkUnauthorizedError(response, loginErrorMessage);
    });
  });

  describe('POST /v1/auth/refreshToken', () => {
    let userId;
    let refreshTokenExpires;
    let blacklisted;
    let refreshToken;

    beforeEach(() => {
      userId = userOne._id;
      refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');
      blacklisted = false;
      refreshToken = userOneRefreshToken;
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
      expect(newRefreshToken.user.toHexString()).to.be.equal(userOne._id.toHexString());
      expect(newRefreshToken.blacklisted).to.be.false;

      const oldRefreshToken = await RefreshToken.findOne({ token: userOneRefreshToken });
      expect(oldRefreshToken).not.to.be.ok;
    });

    it('should return an error if refresh token is missing', async () => {
      refreshToken = null;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if the refresh token is signed by an invalid secret', async () => {
      refreshToken = generateToken(userId, refreshTokenExpires, 'invalidSecret');
      const response = await exec();
      checkUnauthorizedError(response);
    });

    it('should return an error if the refresh token is not found', async () => {
      refreshToken = generateToken(userId, refreshTokenExpires);
      const response = await exec();
      checkUnauthorizedError(response);
    });

    const generateAndSaveRefreshToken = async () => {
      refreshToken = generateToken(userId, refreshTokenExpires);

      const refreshTokenObject = {
        token: refreshToken,
        user: userId,
        expires: refreshTokenExpires,
        blacklisted,
      };
      await new RefreshToken(refreshTokenObject).save();
    };

    it('should return an error if the refresh token is blacklisted', async () => {
      blacklisted = true;
      await generateAndSaveRefreshToken();
      const response = await exec();
      checkUnauthorizedError(response);
    });

    it('should return an error if the refresh token is expired', async () => {
      refreshTokenExpires.subtract(jwtConfig.refreshExpirationDays + 1, 'days');
      await generateAndSaveRefreshToken();
      const response = await exec();
      checkUnauthorizedError(response);
    });

    it('should return an error if user is not found', async () => {
      userId = mongoose.Types.ObjectId();
      await generateAndSaveRefreshToken();
      const response = await exec();
      checkUnauthorizedError(response);
    });
  });

  describe('POST /v1/auth/logoutAll', () => {
    let accessToken;

    beforeEach(() => {
      accessToken = userOneAccessToken;
    });

    const exec = async () => {
      return request(app)
        .post('/v1/auth/logoutAll')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
    };

    it('should successfully delete all refresh tokens for the user', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbRefreshTokenCount = await RefreshToken.countDocuments({ user: userOne._id });
      expect(dbRefreshTokenCount).to.be.equal(0);
    });

    it('should return an error if no access token is provided', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });
  });

  describe('Auth middleware', () => {
    let req;
    let res;
    let nextSpy;
    let accessToken;
    let userId;
    let expires;
    let requiredRights = [];

    beforeEach(() => {
      res = httpMocks.createResponse();
      nextSpy = sinon.spy();
      accessToken = userOneAccessToken;
      userId = userOne._id.toHexString();
      expires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
      requiredRights = [];
    });

    const exec = async () => {
      req = httpMocks.createRequest({
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          userId,
        },
      });
      const authMiddleware = auth(...requiredRights);
      await authMiddleware(req, res, nextSpy);
    };

    const checkSuccessfulAuth = () => {
      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.firstCall.args.length).to.be.equal(0);
      expect(req.user).to.be.ok;
    };

    it('should call next with no arguments if valid access token', async () => {
      await exec();
      checkSuccessfulAuth();
      expect(req.user._id.toHexString()).to.be.equal(userId);
    });

    const checkFailingAuth = () => {
      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.firstCall.args.length).to.be.equal(1);
      const nextArg = nextSpy.firstCall.args[0];
      expect(nextArg).to.be.ok;
      expect(nextArg.isBoom).to.be.true;
      return nextArg;
    };

    const checkUnauthorizedAuth = () => {
      const err = checkFailingAuth();
      const { statusCode, error, message } = err.output.payload;
      expect(statusCode).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(error).to.be.equal(httpStatus[httpStatus.UNAUTHORIZED]);
      expect(message).to.be.equal('Please authenticate');
    };

    it('should call next with an error if access token is not found in header', async () => {
      accessToken = null;
      await exec();
      checkUnauthorizedAuth();
    });

    it('should call next with an error if access token is not a valid jwt', async () => {
      accessToken = 'randomString';
      await exec();
      checkUnauthorizedAuth();
    });

    it('should call next with an error if token is generated with an invalid secret', async () => {
      accessToken = generateToken(userOne._id, expires, 'invalidSecret');
      await exec();
      checkUnauthorizedAuth();
    });

    it('should call next with an error if token is expired', async () => {
      expires.subtract(jwtConfig.accessExpirationMinutes + 1, 'minutes');
      accessToken = generateToken(userOne._id, expires);
      await exec();
      checkUnauthorizedAuth();
    });

    it('should call next with an error if user is not found', async () => {
      const invalidUserId = mongoose.Types.ObjectId();
      accessToken = generateToken(invalidUserId, expires);
      await exec();
      checkUnauthorizedAuth();
    });

    const checkForbiddenAuth = () => {
      const err = checkFailingAuth();
      const { statusCode, error, message } = err.output.payload;
      expect(statusCode).to.be.equal(httpStatus.FORBIDDEN);
      expect(error).to.be.equal(httpStatus[httpStatus.FORBIDDEN]);
      expect(message).to.be.equal('Forbidden');
    };

    it('should call next with an error if user does not have required rights and her id is not in the params', async () => {
      requiredRights = ['unknownRight'];
      userId = undefined;
      await exec();
      checkForbiddenAuth();
    });

    it('should call next with no arguments if user does not have required rights but her id is in the params', async () => {
      requiredRights = ['unknownRight'];
      await exec();
      checkSuccessfulAuth();
    });

    it('should call next with no arguments if user has the required rights', async () => {
      requiredRights = ['getUsers'];
      accessToken = adminAccessToken;
      await exec();
      checkSuccessfulAuth();
    });
  });
});
