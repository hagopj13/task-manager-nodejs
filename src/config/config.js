const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.join(__dirname, '../../.env'),
});

const getMongodbUrl = () => {
  if (process.env.DOCKER_MONGODB_URL) {
    return process.env.DOCKER_MONGODB_URL;
  }
  return process.env.NODE_ENV === 'test' ? process.env.MONDODB_TEST_URL : process.env.MONDODB_URL;
};

const envirnomentVariables = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  mongodbUrl: getMongodbUrl(),
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpirationMinutes: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES, 10),
    refreshExpirationDays: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS, 10),
    resetPasswordExpirationMinutes: 10,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
};

module.exports = envirnomentVariables;
