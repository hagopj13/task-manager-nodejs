const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const mongoose = require('mongoose');
const moment = require('moment');
const { pick, omit, set } = require('lodash');
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
  let reqBody;
  beforeEach(async () => {
    await resetDatabase();
  });

  const testBodyValidation = (exec, testCases) => {
    return testCases.forEach(testCase => {
      it(`should return a 400 error if ${testCase.message}`, async () => {
        reqBody = testCase.body;
        const response = await exec();
        checkValidationError(response);
      });
    });
  };

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
    beforeEach(() => {
      reqBody = {
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
        .send(reqBody);
    };

    it('should register new user when request data is ok', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      const { password } = reqBody;
      delete reqBody.password;
      expect(response.body.user).to.include(reqBody);
      expect(response.body.user).not.to.have.property('password');
      expect(response.body.user).to.have.property('id');
      checkTokensInResponse(response);

      const dbUser = await User.findById(response.body.user.id);
      expect(dbUser).to.be.ok;
      expect(dbUser).to.include(reqBody);
      expect(dbUser.password).not.to.be.equal(password);
    });

    const bodyValidationTestCases = [
      { body: {}, message: 'body is empty' },
      { body: omit(reqBody, 'email'), message: 'email is missing' },
      { body: set(reqBody, 'email', 'notValid'), message: 'email is invalid' },
      { body: set(reqBody, 'email', userOne.email), message: 'email is duplicate' },
      { body: omit(reqBody, 'password'), message: 'password is missing' },
      {
        body: set(reqBody, 'password', 'myPassword'),
        message: 'password contains the word password',
      },
      {
        body: set(reqBody, 'password', 'Red123!'),
        message: 'password is shorter than 8 characters',
      },
      { body: omit(reqBody, 'name'), message: 'name is missing' },
      { body: set(reqBody, 'age', -1), message: 'age is less than 0' },
      { body: set(reqBody, 'role', 'invalidRole'), message: 'role is not user or admin' },
    ];
    testBodyValidation(exec, bodyValidationTestCases);

    it('should set the age by default to 0 if not given', async () => {
      delete reqBody.age;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body.user.age).to.be.equal(0);
    });

    it('should set the role by default to user if not given', async () => {
      delete reqBody.role;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body.user.role).to.be.equal('user');
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(() => {
      reqBody = {
        email: userOne.email,
        password: userOne.password,
      };
    });

    const exec = async () => {
      return request(app)
        .post('/v1/auth/login')
        .send(reqBody);
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
      delete reqBody.email;
      const response = await exec();
      checkValidationError(response);
    });

    it('should return a 400 error if password is missing', async () => {
      delete reqBody.password;
      const response = await exec();
      checkValidationError(response);
    });

    const loginErrorMessage = 'Incorrect email or password';

    it('should return a 401 error if user with such an email is not found', async () => {
      reqBody.email = 'unknownEmail@example.com';
      const response = await exec();
      checkUnauthorizedError(response, loginErrorMessage);
    });

    it('should return a 401 error if user password is wrong', async () => {
      reqBody.password = 'wrongPassword';
      const response = await exec();
      checkUnauthorizedError(response, loginErrorMessage);
    });
  });

  describe('POST /v1/auth/refreshToken', () => {
    let userId;
    let refreshTokenExpires;
    let blacklisted;

    beforeEach(() => {
      userId = userOne._id;
      refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');
      blacklisted = false;
      reqBody = { refreshToken: userOneRefreshToken };
    });

    const exec = async () => {
      return request(app)
        .post('/v1/auth/refreshToken')
        .send(reqBody);
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
      reqBody = { refreshToken: null };
      const response = await exec();
      checkValidationError(response);
    });

    it('should return an error if the refresh token is signed by an invalid secret', async () => {
      reqBody = { refreshToken: generateToken(userId, refreshTokenExpires, 'invalidSecret') };
      const response = await exec();
      checkUnauthorizedError(response);
    });

    it('should return an error if the refresh token is not found', async () => {
      reqBody = { refreshToken: generateToken(userId, refreshTokenExpires) };
      const response = await exec();
      checkUnauthorizedError(response);
    });

    const generateAndSaveRefreshToken = async () => {
      reqBody = { refreshToken: generateToken(userId, refreshTokenExpires) };

      const refreshTokenObject = {
        token: reqBody.refreshToken,
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
