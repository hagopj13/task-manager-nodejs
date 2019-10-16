const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const httpMocks = require('node-mocks-http');
const httpStatus = require('http-status');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');
const { AppError } = require('../../../src/utils/error.util');

describe('Error middleware tests', () => {
  describe('Error converter', () => {
    let req;
    let res;
    let nextSpy;

    beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      nextSpy = sinon.spy();
    });

    it('should not alter an AppError object', () => {
      const error = new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Any error');
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.equal(error);
    });

    const testErrorConversion = (error, expectedStatus, expectedMessage, expectedIsOperational) => {
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.an.instanceOf(AppError);
      const { statusCode, message, isOperational } = newError;
      expect(statusCode).to.be.equal(expectedStatus);
      expect(message).to.be.equal(expectedMessage);
      expect(isOperational).to.be.equal(expectedIsOperational);
    };

    it('should convert an Error to AppError and preserve its status and message', () => {
      const originalErrorMessage = 'original error message';
      const originalStatusCode = httpStatus.INTERNAL_SERVER_ERROR;
      const error = new Error(originalErrorMessage);
      error.statusCode = originalStatusCode;
      testErrorConversion(error, originalStatusCode, originalErrorMessage, false);
    });

    it('should convert an Error without status to AppError with status 500', () => {
      const originalErrorMessage = 'original error message';
      const error = new Error(originalErrorMessage);
      testErrorConversion(error, httpStatus.INTERNAL_SERVER_ERROR, originalErrorMessage, false);
    });

    it('should convert an Error without message to AppError with default message of the http status', () => {
      const originalStatusCode = httpStatus.INTERNAL_SERVER_ERROR;
      const error = new Error();
      error.statusCode = originalStatusCode;
      testErrorConversion(error, originalStatusCode, httpStatus[originalStatusCode], false);
    });

    it('should convert an object to AppError with status 500 and its default message', () => {
      const error = {};
      testErrorConversion(error, httpStatus.INTERNAL_SERVER_ERROR, httpStatus[httpStatus.INTERNAL_SERVER_ERROR], false);
    });

    it('should convert a string to AppError with status 500 and its default message', () => {
      const error = 'any message';
      testErrorConversion(error, httpStatus.INTERNAL_SERVER_ERROR, httpStatus[httpStatus.INTERNAL_SERVER_ERROR], false);
    });
  });

  describe('Error handler', () => {
    let req;
    let res;
    let sendSpy;
    let error;
    const next = () => {};
    const statusCode = httpStatus.BAD_REQUEST;
    const errorMessage = 'error message';

    beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      sendSpy = sinon.spy(res, 'send');
    });

    const checkErrorResponse = expectedResponse => {
      expect(sendSpy.calledOnce).to.be.true;
      const response = sendSpy.firstCall.args[0];
      expect(response).to.deep.equal(expectedResponse);
    };

    it('should send proper error response if given AppError', () => {
      error = new AppError(statusCode, errorMessage);
      const expectedResponse = { code: statusCode, message: errorMessage };
      errorHandler(error, req, res, next);
      checkErrorResponse(expectedResponse);
      expect(res.locals.errorMessage).to.be.equal(errorMessage);
    });

    it('should put stack in the error response if in development env', () => {
      error = new AppError(statusCode, errorMessage);
      const errorMiddlewares = rewire('../../../src/middlewares/error');
      errorMiddlewares.__with__({
        env: 'development',
      })(() => errorMiddlewares.errorHandler(error, req, res, next));
      expect(sendSpy.calledOnce).to.be.true;
      const response = sendSpy.firstCall.args[0];
      expect(response).to.have.property('stack');
    });

    const testProductionErrorHandler = expectedResponse => {
      const errorMiddlewares = rewire('../../../src/middlewares/error');
      errorMiddlewares.__with__({
        env: 'production',
      })(() => errorMiddlewares.errorHandler(error, req, res, next));
      checkErrorResponse(expectedResponse);
    };

    it('should preserve statusCode and message if in production env and error is operational', () => {
      error = new AppError(statusCode, errorMessage);
      const expectedResponse = { code: statusCode, message: errorMessage };
      testProductionErrorHandler(expectedResponse);
      expect(res.locals.errorMessage).to.be.equal(errorMessage);
    });

    it('should send internal server error status and message if in production env and error is not operational', () => {
      error = new AppError(statusCode, errorMessage, false);
      const expectedResponse = {
        code: httpStatus.INTERNAL_SERVER_ERROR,
        message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
      };
      testProductionErrorHandler(expectedResponse);
      expect(res.locals.errorMessage).to.be.equal(errorMessage);
    });
  });
});
