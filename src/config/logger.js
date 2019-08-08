const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const appRoot = require('app-root-path');
const fs = require('fs');
const { env } = require('./config');

const logDir = `${appRoot}/logs/`;
const isDevelopmentMode = env === 'development';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const fileTransportCommonOptions = {
  datePattern: 'YYYY-MM-DD',
  handleExceptions: true,
  silent: isDevelopmentMode,
};

const consoleTransport = new transports.Console({
  level: 'debug',
  format: format.combine(
    format.colorize(),
    format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  handleExceptions: true,
});

const combinedFileTransport = new transports.DailyRotateFile({
  level: 'info',
  filename: `${logDir}/%DATE%-all.log`,
  ...fileTransportCommonOptions,
});

const errorsFileTransport = new transports.DailyRotateFile({
  level: 'error',
  filename: `${logDir}/%DATE%-errors.log`,
  ...fileTransportCommonOptions,
});

const logger = createLogger({
  level: isDevelopmentMode ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.json()
  ),
  transports: [consoleTransport, combinedFileTransport, errorsFileTransport],
});

logger.stream = {
  write: message => {
    logger.info(message);
  },
};

module.exports = logger;
