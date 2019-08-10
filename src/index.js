const { port } = require('./config/config');
const logger = require('./config/logger');
const app = require('./app');

app.listen(port, () => {
  logger.info(`Listening to port ${port}`);
});

process.on('uncaughtException', e => {
  logger.error(e);
  process.exit(1);
});

process.on('unhandledRejection', e => {
  logger.error(e);
  process.exit(1);
});
