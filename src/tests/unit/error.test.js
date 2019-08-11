const { expect } = require('chai');
const sinon = require('sinon');
const httpMocks = require('node-mocks-http');
const Boom = require('boom');
const { errorConverter } = require('../../middlewares/error');

describe('Error tests', () => {
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
      expect(statusCode).to.be.equal(500);
      expect(message).to.be.equal('An internal server error occurred');
      expect(res.locals.originalErrorMessage).to.be.equal(originalErrorMessage);
    });

    it('should convert an error status to boom and store its message', () => {
      const originalErrorMessage = 'original error message';
      const originalStatusCode = 400;
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
      expect(statusCode).to.be.equal(500);
      expect(message).to.be.equal('An internal server error occurred');
      expect(res.locals.originalErrorMessage).to.be.equal('');
    });

    it('should convert an string to boom 500', () => {
      const error = 'any message';
      errorConverter(error, req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const newError = nextSpy.firstCall.args[0];
      expect(newError).to.be.an.instanceOf(Boom);
      const { statusCode, message } = newError.output.payload;
      expect(statusCode).to.be.equal(500);
      expect(message).to.be.equal('An internal server error occurred');
      expect(res.locals.originalErrorMessage).to.be.equal('');
    });
  });
});
