const Boom = require('boom');
const { env } = require('../config/config');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!error.isBoom) {
    const statusCode = error.statusCode || 500;
    res.locals.originalErrorMessage = error.message || '';
    error = new Boom(error, { statusCode });
  }

  next(error);
};

const errorHandler = (err, req, res, next) => {
  let errorObj = err;
  if (!(errorObj instanceof Boom)) {
    errorObj = Boom.badImplementation();
  }
  const { statusCode: status, error, message } = errorObj.output.payload;
  const response = { status, error, message };

  if (env === 'development') {
    response.stack = errorObj.stack;
  }

  res.locals.errorMessage =
    status === 500 && res.locals.originalErrorMessage ? res.locals.originalErrorMessage : message;

  res.status(status).send(response);

  if (env === 'development') {
    next(errorObj);
  }
};

const notFoundError = (req, res, next) => {
  next(Boom.notFound());
};

module.exports = {
  errorConverter,
  errorHandler,
  notFoundError,
};
