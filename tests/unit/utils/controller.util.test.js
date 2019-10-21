const { expect } = require('chai');
const sinon = require('sinon');
const httpMocks = require('node-mocks-http');
const httpStatus = require('http-status');
const { catchAsync } = require('../../../src/utils/controller.util');
const { AppError } = require('../../../src/utils/error.util');

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

    afterEach(() => {
      sinon.restore();
    });

    it('should not call next if no errors occur', async () => {
      const fn = () => Promise.resolve();
      const asyncController = catchAsync(fn);
      await asyncController(req, res, nextSpy);
      expect(nextSpy.called).to.be.false;
    });

    it('should call next with error object if error occurs', async () => {
      const error = new AppError(httpStatus.BAD_REQUEST, 'Any error');
      const fn = () => Promise.reject(error);
      const asyncController = catchAsync(fn, defaultStatusCode);
      await asyncController(req, res, nextSpy);
      expect(nextSpy.calledOnce).to.be.true;
      const nextError = nextSpy.firstCall.args[0];
      expect(nextError).to.be.equal(error);
    });
  });
});
