const { expect } = require('chai');
const sinon = require('sinon');
const httpMocks = require('node-mocks-http');
const Boom = require('boom');
const httpStatus = require('http-status');
const asyncController = require('../../middlewares/controller');

describe('Contoller middleware tests', () => {
  describe('Async controller', () => {
    let req;
    let res;
    let nextSpy;

    beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      nextSpy = sinon.spy();
    });

    it('should not call next if no errors take place', async () => {
      const fn = () => Promise.resolve();
      const controllerMiddleware = asyncController(fn);
      await controllerMiddleware(req, res, nextSpy);
      expect(nextSpy.called).to.be.false;
    });

    it('should call next with boom object if error is boom', async () => {
      const error = new Boom();
      const fn = () => Promise.reject(error);
      const controllerMiddleware = asyncController(fn);
      await controllerMiddleware(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const nextError = nextSpy.firstCall.args[0];
      expect(nextError).to.be.equal(error);
    });

    it('should call next with error object with default status undefined', async () => {
      const errorMessage = 'error message';
      const error = new Error(errorMessage);
      const fn = () => Promise.reject(error);
      const controllerMiddleware = asyncController(fn);
      await controllerMiddleware(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const nextError = nextSpy.firstCall.args[0];
      expect(nextError).to.be.equal(error);
      expect(nextError.statusCode).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
      expect(nextError.message).to.be.equal(errorMessage);
    });

    it('should call next with error object with defined default status', async () => {
      const errorMessage = 'error message';
      const error = new Error(errorMessage);
      const fn = () => Promise.reject(error);
      const defaultStatusCode = httpStatus.BAD_REQUEST;
      const controllerMiddleware = asyncController(fn, defaultStatusCode);
      await controllerMiddleware(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const nextError = nextSpy.firstCall.args[0];
      expect(nextError).to.be.equal(error);
      expect(nextError.statusCode).to.be.equal(defaultStatusCode);
      expect(nextError.message).to.be.equal(errorMessage);
    });

    it('should call next with error object that already has a status code', async () => {
      const errorMessage = 'error message';
      const error = new Error(errorMessage);
      const definedStatusCode = httpStatus.NOT_FOUND;
      error.statusCode = definedStatusCode;
      const fn = () => Promise.reject(error);
      const defaultStatusCode = httpStatus.BAD_REQUEST;
      const controllerMiddleware = asyncController(fn, defaultStatusCode);
      await controllerMiddleware(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const nextError = nextSpy.firstCall.args[0];
      expect(nextError).to.be.equal(error);
      expect(nextError.statusCode).to.be.equal(definedStatusCode);
      expect(nextError.message).to.be.equal(errorMessage);
    });
  });
});
