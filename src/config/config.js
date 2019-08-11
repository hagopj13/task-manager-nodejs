const dotenv = require('dotenv-safe');
const path = require('path');

dotenv.load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example'),
});

const envirnomentVariables = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  mongodbUrl:
    process.env.NODE_ENV === 'test' ? process.env.MONDODB_TEST_URL : process.env.MONDODB_URL,
};

module.exports = envirnomentVariables;
