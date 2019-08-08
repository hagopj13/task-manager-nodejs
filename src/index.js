const { port } = require('./config/config');
const logger = require('./config/logger');
const app = require('./app');

app.listen(port, () => {
  logger.info(`Listening to port ${port}`);
});
