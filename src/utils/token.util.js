const moment = require('moment');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/config');

const generateToken = (userId, expires, secret = jwtConfig.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
  };
  return jwt.sign(payload, secret);
};

module.exports = {
  generateToken,
};
