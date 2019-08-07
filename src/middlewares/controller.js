const asyncController = (fn, defaultCode) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (!err.isBoom && !err.statusCode) {
      // eslint-disable-next-line no-param-reassign
      err.statusCode = defaultCode || 500
    }
    next(err)
  })
}

module.exports = asyncController
