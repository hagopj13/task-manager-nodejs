const { createLogger, format, transports } = require('winston');
const { env } = require('./config');

const logger = createLogger({
  level: env === 'development' ? 'debug' : 'info',
  transports: [
    new transports.Console({
      level: 'debug',
      stderrLevels: ['error'],
      format: format.combine(
        env === 'development' ? format.colorize() : format.uncolorize(),
        format.printf(({ level, message }) => `${level}: ${message}`)
      ),
      handleExceptions: true,
    }),
  ],
});

module.exports = logger;
