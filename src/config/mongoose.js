const mongoose = require('mongoose');
const { mongodbUrl } = require('./config');
const logger = require('./logger');

mongoose
  .connect(mongodbUrl, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch(error => {
    logger.error(error.message);
    process.exit(1);
  });
