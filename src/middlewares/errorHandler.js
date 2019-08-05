const errorHandler = function (err, req, res, next) {
  if (res.headersSent) {
    next(err);
  }

  const { statusCode: status = 500, message } = err.output.payload

  res.status(status);
  res.set('Content-Type', 'application/json');
  res.send({ status, message });
  next(err);
}

module.exports = errorHandler
