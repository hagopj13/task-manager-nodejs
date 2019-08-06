const boom = require('boom');

const asyncController = (fn, defaultCode) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (!err.isBoom) {
      const statusCode = defaultCode || 500
      next(boom.boomify(err, { statusCode }))
    }
    next(err);
  });
}

module.exports = asyncController
