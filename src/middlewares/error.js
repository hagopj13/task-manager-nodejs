/* eslint no-unused-vars: 0 */
const Boom = require('boom');
const { env } = require('../config/config');
const logger = require('../config/logger');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!error.isBoom) {
    const statusCode = error.statusCode || 500;
    res.locals.originalErrorMessage = error.message;
    error = new Boom(error, { statusCode });
  }

  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
  }

  const { statusCode: status, error, message } = err.output.payload;
  const response = { status, error, message };

  if (env === 'development') {
    response.stack = err.stack;
  }

  res.locals.errorMessage = status === 500 ? res.locals.originalErrorMessage : message;

  res.set('Content-Type', 'application/json');
  res.status(status).send(response);
};

const notFoundError = (req, res, next) => {
  next(Boom.notFound());
};

module.exports = {
  errorConverter,
  errorHandler,
  notFoundError,
};
