const catchAsync = (fn, defaultCode = 500) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    const error = err;
    if (!error.isBoom && !error.statusCode) {
      error.statusCode = defaultCode;
    }
    next(error);
  });
};

module.exports = {
  catchAsync,
};
