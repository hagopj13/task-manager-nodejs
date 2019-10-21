const { expect } = require('chai');
const sinon = require('sinon');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const mongoose = require('mongoose');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const { omit, set } = require('lodash');
const request = require('../utils/testRequest');
const { User, Token } = require('../../src/models');
const { jwt: jwtConfig } = require('../../src/config/config');
const auth = require('../../src/middlewares/auth');
const { generateToken } = require('../../src/services/token.service');
const emailService = require('../../src/services/email.service');
const { AppError } = require('../../src/utils/error.util');
const { checkValidationError, checkUnauthorizedError, checkNotFoundError } = require('../utils/checkError');
const { checkResponseTokens, checkResponseUser } = require('../utils/checkResponse');
const { testMissingAccessToken, testBodyValidation } = require('../utils/commonTests');
const { clearDatabase } = require('../fixtures');
const { userOne, userOneAccessToken, adminAccessToken, insertAllUsers } = require('../fixtures/user.fixture');
const { userOneRefreshToken, userOneResetPasswordToken, insertToken } = require('../fixtures/token.fixture');

describe('Auth Route', () => {
  let reqBody;
  beforeEach(async () => {
    await clearDatabase();
    await insertAllUsers();
    await insertToken(userOneRefreshToken);
  });

  describe('POST /v1/auth/register', () => {
    beforeEach(() => {
      reqBody = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'White1234!',
        age: 22,
      };
    });

    const getReqConfig = () => {
      return {
        method: 'POST',
        url: '/v1/auth/register',
        body: reqBody,
      };
    };

    it('should successfully register new user and return 201 if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.CREATED);
      checkResponseTokens(response.data.tokens);

      delete reqBody.password;
      expect(response.data.user).to.include(reqBody);

      const dbUser = await User.findById(response.data.user.id);
      delete reqBody.password;
      expect(dbUser).to.include(reqBody);
      checkResponseUser(response.data.user, dbUser);
    });

    it('should encrypt the password before creating user', async () => {
      const response = await request(getReqConfig());
      const dbUser = await User.findById(response.data.user.id);
      expect(dbUser.password).not.to.be.equal(reqBody.password);
    });

    const bodyValidationTestCases = [
      { body: {}, message: 'body is empty' },
      { body: omit(reqBody, 'email'), message: 'email is missing' },
      { body: set(reqBody, 'email', 'notValid'), message: 'email is invalid' },
      { body: omit(reqBody, 'password'), message: 'password is missing' },
      { body: set(reqBody, 'password', 'myPassword'), message: 'password contains the word password' },
      { body: set(reqBody, 'password', 'short'), message: 'password is shorter than 8 characters' },
      { body: omit(reqBody, 'name'), message: 'name is missing' },
      { body: set(reqBody, 'age', -1), message: 'age is less than 0' },
      { body: set(reqBody, 'role', 'admin'), message: 'role is specified' },
    ];
    testBodyValidation(getReqConfig, bodyValidationTestCases);

    it('should return a 401 error if email is duplicate', async () => {
      reqBody.email = userOne.email;
      const response = await request(getReqConfig());
      checkValidationError(response);
    });

    it('should set the age by default to 0 if not given', async () => {
      delete reqBody.age;
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.data.user.age).to.be.equal(0);
    });

    it('should set the role by default to user', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.data.user.role).to.be.equal('user');
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(() => {
      reqBody = {
        email: userOne.email,
        password: userOne.password,
      };
    });

    const getReqConfig = () => {
      return {
        method: 'POST',
        url: '/v1/auth/login',
        body: reqBody,
      };
    };

    it('should successfully login and return 200 if correct email and password are provided', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      checkResponseTokens(response.data.tokens);
      const dbUser = await User.findById(userOne._id);
      checkResponseUser(response.data.user, dbUser);
    });

    const bodyValidationTestCases = [
      { body: omit(reqBody, 'email'), message: 'email is missing' },
      { body: omit(reqBody, 'password'), message: 'password is missing' },
    ];
    testBodyValidation(getReqConfig, bodyValidationTestCases);

    const loginErrorMessage = 'Incorrect email or password';

    it('should return a 401 error if user with such an email is not found', async () => {
      reqBody.email = 'unknownEmail@example.com';
      const response = await request(getReqConfig());
      checkUnauthorizedError(response, loginErrorMessage);
    });

    it('should return a 401 error if user password is wrong', async () => {
      reqBody.password = 'wrongPassword';
      const response = await request(getReqConfig());
      checkUnauthorizedError(response, loginErrorMessage);
    });
  });

  describe('POST /v1/auth/refreshTokens', () => {
    let userId;
    let refreshTokenExpires;
    let blacklisted;

    beforeEach(() => {
      userId = userOne._id;
      refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');
      blacklisted = false;
      reqBody = { refreshToken: userOneRefreshToken.token };
    });

    const getReqConfig = () => {
      return {
        method: 'POST',
        url: '/v1/auth/refreshTokens',
        body: reqBody,
      };
    };

    it('should successfully refresh access token and return 200 if refresh token is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      checkResponseTokens(response.data);

      const dbRefreshToken = await Token.findOne({
        token: response.data.refreshToken.token,
      });
      expect(dbRefreshToken).to.be.ok;
      expect(dbRefreshToken.user).to.deep.equal(userOne._id);
      expect(dbRefreshToken.blacklisted).to.be.false;
    });

    it('should delete the old refresh token after creating a new one', async () => {
      await request(getReqConfig());
      const oldRefreshToken = await Token.findOne({ token: userOneRefreshToken.token });
      expect(oldRefreshToken).not.to.be.ok;
    });

    const bodyValidationTestCases = [{ body: omit(reqBody, 'refreshToken'), message: 'refreshToken is missing' }];
    testBodyValidation(getReqConfig, bodyValidationTestCases);

    it('should return a 401 error if the refresh token is signed by an invalid secret', async () => {
      reqBody = { refreshToken: generateToken(userId, refreshTokenExpires, 'invalidSecret') };
      const response = await request(getReqConfig());
      checkUnauthorizedError(response);
    });

    it('should return a 401 error if the refresh token is not found', async () => {
      reqBody = { refreshToken: generateToken(userId, refreshTokenExpires) };
      const response = await request(getReqConfig());
      checkUnauthorizedError(response);
    });

    const generateAndSaveRefreshToken = async () => {
      reqBody.refreshToken = generateToken(userId, refreshTokenExpires);
      const refreshToken = {
        token: reqBody.refreshToken,
        user: userId,
        type: 'refresh',
        expires: refreshTokenExpires.toDate(),
        blacklisted,
      };
      await insertToken(refreshToken);
    };

    it('should return a 401 error if the refresh token is blacklisted', async () => {
      blacklisted = true;
      await generateAndSaveRefreshToken();
      const response = await request(getReqConfig());
      checkUnauthorizedError(response);
    });

    it('should return a 401 error if the refresh token is expired', async () => {
      refreshTokenExpires.subtract(jwtConfig.refreshExpirationDays + 1, 'days');
      await generateAndSaveRefreshToken();
      const response = await request(getReqConfig());
      checkUnauthorizedError(response);
    });

    it('should return a 401 error if user is not found', async () => {
      userId = mongoose.Types.ObjectId();
      await generateAndSaveRefreshToken();
      const response = await request(getReqConfig());
      checkUnauthorizedError(response);
    });
  });

  describe('POST /v1/auth/logoutAll', () => {
    let accessToken;

    beforeEach(() => {
      accessToken = userOneAccessToken;
    });

    const getReqConfig = () => {
      return {
        method: 'POST',
        url: '/v1/auth/logoutAll',
        headers: { Authorization: `Bearer ${accessToken}` },
      };
    };

    it('should successfully delete all refresh tokens for the user and return 204', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbRefreshTokenCount = await Token.countDocuments({ user: userOne._id, type: 'refresh' });
      expect(dbRefreshTokenCount).to.be.equal(0);
    });

    testMissingAccessToken(getReqConfig);
  });

  describe('POST /v1/auth/forgetPassword', () => {
    let sendResetPasswordEmailSpy;
    let transporterStub;

    beforeEach(() => {
      reqBody = { email: userOne.email };
      sendResetPasswordEmailSpy = sinon.spy(emailService, 'sendResetPasswordEmail');
      transporterStub = sinon.stub(emailService.transporter, 'sendMail').resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    const getReqConfig = () => {
      return {
        method: 'POST',
        url: '/v1/auth/forgotPassword',
        body: reqBody,
      };
    };

    it('should successfully return 204 response and send a reset password email to the user', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      expect(sendResetPasswordEmailSpy.calledOnce).to.be.true;
      const { args } = sendResetPasswordEmailSpy.firstCall;
      expect(args).to.have.lengthOf(3);
      expect(args[0]).to.be.equal(reqBody.email);
      expect(transporterStub.calledOnce).to.be.true;

      const dbResetPasswordTokens = await Token.find({ user: userOne._id, type: 'resetPassword' });
      expect(dbResetPasswordTokens).to.have.lengthOf(1);
      expect(dbResetPasswordTokens[0].token).to.be.equal(args[1]);
    });

    const bodyValidationTestCases = [
      { body: omit(reqBody, 'email'), message: 'email is missing' },
      { body: set(reqBody, 'email', 'invalidEmail'), message: 'email must be valid' },
    ];
    testBodyValidation(getReqConfig, bodyValidationTestCases);

    it('should return a 404 error if the email does not belong to any user', async () => {
      reqBody.email = 'unknownEmail@example.com';
      const response = await request(getReqConfig());
      checkNotFoundError(response);
    });
  });

  describe('POST /v1/auth/resetPassword', () => {
    let reqQuery;
    let userId;
    let resetPasswordTokenExpires;
    let blacklisted;

    beforeEach(async () => {
      await insertToken(userOneResetPasswordToken);
      userId = userOne._id;
      resetPasswordTokenExpires = moment().add(jwtConfig.resetPasswordExpirationMinutes, 'minutes');
      blacklisted = false;
      reqQuery = { token: userOneResetPasswordToken.token };
      reqBody = { password: 'newPass123!' };
    });

    const getReqConfig = () => {
      return {
        method: 'POST',
        url: '/v1/auth/resetPassword',
        query: reqQuery,
        body: reqBody,
      };
    };

    it('should successfully reset the password and return 204 if the reset password token is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userId);
      const isNewPassword = await bcrypt.compare(reqBody.password, dbUser.password);
      expect(isNewPassword).to.be.true;
    });

    it('should delete all refresh and reset password tokens after successful reset', async () => {
      await request(getReqConfig());

      const dbResetPasswordTokenCount = await Token.countDocuments({ user: userOne._id, type: 'resetPassword' });
      expect(dbResetPasswordTokenCount).to.be.equal(0);

      const dbRefreshTokenCount = await Token.countDocuments({ user: userOne._id, type: 'refresh' });
      expect(dbRefreshTokenCount).to.be.equal(0);
    });

    it('should return a 400 error if the reset password token is missing', async () => {
      delete reqQuery.token;
      const response = await request(getReqConfig());
      checkValidationError(response);
    });

    const bodyValidationTestCases = [
      { body: omit(reqBody, 'password'), message: 'password is missing' },
      { body: set(reqBody, 'password', 'myPassword'), message: 'password contains the word password' },
      { body: set(reqBody, 'password', 'short'), message: 'password is shorter than 8 characters' },
    ];
    testBodyValidation(getReqConfig, bodyValidationTestCases);

    const generateAndSaveResetPasswordToken = async () => {
      reqQuery.token = generateToken(userId, resetPasswordTokenExpires);
      const resetPasswordToken = {
        token: reqQuery.token,
        user: userId,
        type: 'resetPassword',
        expires: resetPasswordTokenExpires.toDate(),
        blacklisted,
      };
      await insertToken(resetPasswordToken);
    };

    const checkResetPasswordError = response => {
      expect(response.status).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(response.data.code).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(response.data.message).to.be.equal('Password reset failed');
    };

    it('should return a 401 error if the reset password token is blacklisted', async () => {
      blacklisted = true;
      await generateAndSaveResetPasswordToken();
      const response = await request(getReqConfig());
      checkResetPasswordError(response);
    });

    it('should return a 401 error if the reset password token is expired', async () => {
      resetPasswordTokenExpires.subtract(jwtConfig.resetPasswordExpirationMinutes + 1, 'minutes');
      await generateAndSaveResetPasswordToken();
      const response = await request(getReqConfig());
      checkResetPasswordError(response);
    });

    it('should return a 401 error if user is not found', async () => {
      userId = mongoose.Types.ObjectId();
      await generateAndSaveResetPasswordToken();
      const response = await request(getReqConfig());
      checkResetPasswordError(response);
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

    afterEach(() => {
      sinon.restore();
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

    const checkFailingAuth = () => {
      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.firstCall.args.length).to.be.equal(1);
      const nextArg = nextSpy.firstCall.args[0];
      expect(nextArg).to.be.ok;
      expect(nextArg instanceof AppError).to.be.true;
      return nextArg;
    };

    const checkUnauthorizedAuth = () => {
      const err = checkFailingAuth();
      const { statusCode, message } = err;
      expect(statusCode).to.be.equal(httpStatus.UNAUTHORIZED);
      expect(message).to.be.equal('Please authenticate');
    };

    const checkForbiddenAuth = () => {
      const err = checkFailingAuth();
      const { statusCode, message } = err;
      expect(statusCode).to.be.equal(httpStatus.FORBIDDEN);
      expect(message).to.be.equal('Forbidden');
    };

    it('should call next with no arguments if access token is valid', async () => {
      await exec();
      checkSuccessfulAuth();
      expect(req.user._id.toHexString()).to.be.equal(userId);
    });

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
