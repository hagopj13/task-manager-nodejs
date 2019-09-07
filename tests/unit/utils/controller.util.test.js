const { expect } = require('chai');
const sinon = require('sinon');
const httpMocks = require('node-mocks-http');
const Boom = require('boom');
const httpStatus = require('http-status');
const { catchAsync } = require('../../../src/utils/controller.utils');

describe('Contoller middleware tests', () => {
  describe('Async controller', () => {
    let req;
    let res;
    let nextSpy;
    let defaultStatusCode;

    beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      nextSpy = sinon.spy();
      defaultStatusCode = undefined;
    });

    it('should not call next if no errors take place', async () => {
      const fn = () => Promise.resolve();
      const asyncController = catchAsync(fn);
      await asyncController(req, res, nextSpy);
      expect(nextSpy.called).to.be.false;
    });

    const generateError = async error => {
      const fn = () => Promise.reject(error);
      const asyncController = catchAsync(fn, defaultStatusCode);
      await asyncController(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      return nextSpy.firstCall.args[0];
    };

    it('should call next with boom object if error is boom', async () => {
      const error = new Boom();
      const nextError = await generateError(error);
      expect(nextError).to.be.an.instanceOf(Boom);
    });

    it('should call next with error object with default status undefined', async () => {
      const errorMessage = 'error message';
      const error = new Error(errorMessage);
      const nextError = await generateError(error);
      expect(nextError.statusCode).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
      expect(nextError.message).to.be.equal(errorMessage);
    });

    it('should call next with error object with defined default status', async () => {
      defaultStatusCode = httpStatus.BAD_REQUEST;
      const errorMessage = 'error message';
      const error = new Error(errorMessage);
      const nextError = await generateError(error);
      expect(nextError.statusCode).to.be.equal(defaultStatusCode);
      expect(nextError.message).to.be.equal(errorMessage);
    });

    it('should call next with error object that already has a status code', async () => {
      defaultStatusCode = httpStatus.BAD_REQUEST;
      const errorMessage = 'error message';
      const error = new Error(errorMessage);
      const definedStatusCode = httpStatus.NOT_FOUND;
      error.statusCode = definedStatusCode;
      const nextError = await generateError(error);
      expect(nextError.statusCode).to.be.equal(definedStatusCode);
      expect(nextError.message).to.be.equal(errorMessage);
    });
  });
});
