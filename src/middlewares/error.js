const httpStatus = require('http-status');
const { env } = require('../config/config');
const { AppError } = require('../utils/error.util');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new AppError(statusCode, message, false);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).send(response);
};

const notFoundError = (req, res, next) => {
  next(new AppError(httpStatus.NOT_FOUND, 'Not found'));
};

module.exports = {
  errorConverter,
  errorHandler,
  notFoundError,
};
