const Boom = require('boom')

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err)
  }

  let error = err

  if (!error.isBoom) {
    const statusCode = error.statusCode || 500
    const data = error.stack
    error = new Boom(error, { statusCode, data })
  }

  const { statusCode: status, message } = error.output.payload
  const response = { status, message }

  if (error.data && process.env.NODE_ENV === 'development') {
    response.stack = error.data
  }

  res.set('Content-Type', 'application/json')
  res.status(status).send(response)
  next(error)
}

module.exports = {
  errorHandler,
}
