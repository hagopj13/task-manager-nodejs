const { port } = require('./config/config');
const logger = require('./config/logger');
const app = require('./app');

const server = app.listen(port, () => {
  logger.info(`Listening to port ${port}`);
});

const closeServer = () => {
  server.close(() => {
    process.exit(1);
  });
};

process.on('uncaughtException', e => {
  logger.error(e);
  closeServer();
});

process.on('unhandledRejection', e => {
  logger.error(e);
  closeServer();
});
