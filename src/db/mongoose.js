const mongoose = require('mongoose');
const { mongodbUrl } = require('../config/config');
const logger = require('../config/logger');

mongoose
  .connect(mongodbUrl, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch(error => logger.error(error.message));
