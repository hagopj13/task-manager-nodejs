const mongoose = require('mongoose');
const { mongodbUrl } = require('./config');
const logger = require('./logger');

mongoose.connection.on('error', error => {
  logger.error(`MongoDB connection error ${error}`);
  process.exit(1);
});

const mongooseOpts = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const connectDb = () => {
  mongoose.connect(mongodbUrl, mongooseOpts);
};

module.exports = {
  connectDb,
};
