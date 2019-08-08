const morgan = require('morgan');
const { env } = require('./config');
const logger = require('./logger');

morgan.token('message', (req, res) => res.locals.errorMessage || '');

const getIpFormat = () => (env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successResponseMorgan = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: message => logger.info(message.trim()) },
});

const errorResponseMorgan = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: message => logger.error(message.trim()) },
});

module.exports = {
  successResponseMorgan,
  errorResponseMorgan,
};
