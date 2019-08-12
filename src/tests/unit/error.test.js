const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const httpMocks = require('node-mocks-http');
const Boom = require('boom');
const httpStatus = require('http-status');
const { errorConverter, errorHandler } = require('../../middlewares/error');

describe('Error middleware tests', () => {
  const errorMessage500 = 'An internal server error occurred';

  describe('Error converter', () => {
    let req;
    let res;
    let nextSpy;

    beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      nextSpy = sinon.spy();
    });

    it('should not alter a boom object', () => {
      const error = Boom.badImplementation();
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.equal(error);
    });

    it('should convert an error without status to boom 500 and store its message', () => {
      const originalErrorMessage = 'original error message';
      const error = new Error(originalErrorMessage);
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.an.instanceOf(Boom);
      const { statusCode, message } = newError.output.payload;
      expect(statusCode).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
      expect(message).to.be.equal(errorMessage500);
      expect(res.locals.originalErrorMessage).to.be.equal(originalErrorMessage);
    });

    it('should convert an error status to boom and store its message', () => {
      const originalErrorMessage = 'original error message';
      const originalStatusCode = httpStatus.BAD_REQUEST;
      const error = new Error(originalErrorMessage);
      error.statusCode = originalStatusCode;
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.an.instanceOf(Boom);
      const { statusCode, message } = newError.output.payload;
      expect(statusCode).to.be.equal(originalStatusCode);
      expect(message).to.be.equal(originalErrorMessage);
      expect(res.locals.originalErrorMessage).to.be.equal(originalErrorMessage);
    });

    it('should convert an object to boom 500', () => {
      const error = {};
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.an.instanceOf(Boom);
      const { statusCode, message } = newError.output.payload;
      expect(statusCode).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
      expect(message).to.be.equal(errorMessage500);
      expect(res.locals.originalErrorMessage).to.be.equal('');
    });

    it('should convert an string to boom 500', () => {
      const error = 'any message';
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.an.instanceOf(Boom);
      const { statusCode, message } = newError.output.payload;
      expect(statusCode).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
      expect(message).to.be.equal(errorMessage500);
      expect(res.locals.originalErrorMessage).to.be.equal('');
    });
  });

  describe('Error handler', () => {
    let req;
    let res;
    let sendSpy;
    const next = () => {};
    const originalErrorMessage = 'original error message';

    beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse({
        locals: { originalErrorMessage },
      });
      sendSpy = sinon.spy(res, 'send');
    });

    it('should send proper error response if given boom error', () => {
      const errorMessage = 'error message';
      const statusCode = httpStatus.BAD_REQUEST;
      const error = new Boom(errorMessage, { statusCode });
      errorHandler(error, req, res, next);
      expect(sendSpy.calledOnce).to.be.true;
      const response = sendSpy.firstCall.args[0];
      expect(response).to.have.property('status', statusCode);
      expect(response).to.have.property('error', httpStatus[statusCode]);
      expect(response).to.have.property('message', errorMessage);
      expect(response).not.to.have.property('stack');
      expect(res.locals.errorMessage).to.equal(errorMessage);
    });

    it('should send proper error response if given 500 boom error', () => {
      const errorMessage = 'error message';
      const statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      const error = new Boom(errorMessage, { statusCode });
      errorHandler(error, req, res, next);
      expect(sendSpy.calledOnce).to.be.true;
      const response = sendSpy.firstCall.args[0];
      expect(response).to.have.property('status', statusCode);
      expect(response).to.have.property('error', httpStatus[statusCode]);
      expect(response).to.have.property('message', errorMessage500);
      expect(response).not.to.have.property('stack');
      expect(res.locals.errorMessage).to.equal(originalErrorMessage);
    });

    it('should set errorMessage in res.locals to 500 error message if no original is given', () => {
      delete res.locals.originalErrorMessage;
      const errorMessage = 'error message';
      const statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      const error = new Boom(errorMessage, { statusCode });
      errorHandler(error, req, res, next);
      expect(res.locals.errorMessage).to.equal(errorMessage500);
    });

    it('should send 500 error response if not given boom error', () => {
      const error = undefined;
      errorHandler(error, req, res, next);
      expect(sendSpy.calledOnce).to.be.true;
      const response = sendSpy.firstCall.args[0];
      expect(response).to.have.property('status', httpStatus.INTERNAL_SERVER_ERROR);
      expect(response).to.have.property('error', httpStatus[httpStatus.INTERNAL_SERVER_ERROR]);
      expect(response).to.have.property('message', errorMessage500);
      expect(response).not.to.have.property('stack');
      expect(res.locals.errorMessage).to.equal(originalErrorMessage);
    });

    it('should put stack in the error response if in development env', () => {
      const errorMessage = 'error message';
      const statusCode = httpStatus.BAD_REQUEST;
      const error = new Boom(errorMessage, { statusCode });
      const errorMiddlewares = rewire('../../middlewares/error');
      errorMiddlewares.__with__({
        env: 'development',
      })(() => errorMiddlewares.errorHandler(error, req, res, next));
      expect(sendSpy.calledOnce).to.be.true;
      const response = sendSpy.firstCall.args[0];
      expect(response).to.have.property('stack');
    });
  });
});
