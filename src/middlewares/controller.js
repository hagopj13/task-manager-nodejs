const asyncController = (fn, defaultCode) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    const error = err;
    if (!error.isBoom && !error.statusCode) {
      error.statusCode = defaultCode || 500;
    }
    next(error);
  });
};

module.exports = asyncController;
