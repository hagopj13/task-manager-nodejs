const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

const getMongodbUrl = () => {
  if (process.env.ENFORCED_MONDODB_URL) {
    return process.env.ENFORCED_MONDODB_URL;
  }
  return process.env.NODE_ENV === 'test' ? process.env.MONDODB_TEST_URL : process.env.MONDODB_URL;
};

const envirnomentVariables = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  mongodbUrl: getMongodbUrl(),
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS,
  },
};

module.exports = envirnomentVariables;
