const Boom = require('boom');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!error.isBoom) {
    const statusCode = error.statusCode || 500;
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
  res.set('Content-Type', 'application/json');
  res.status(status).send(response);
  next(error);
};

const notFoundError = (req, res, next) => {
  next(Boom.notFound());
};

module.exports = {
  errorConverter,
  errorHandler,
  notFoundError,
};
