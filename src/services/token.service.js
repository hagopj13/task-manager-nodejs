const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const { AppError } = require('../utils/error.util');
const { jwt: jwtConfig } = require('../config/config');
const { Token } = require('../models');

const generateToken = (userId, expires, secret = jwtConfig.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
  });
  return tokenDoc;
};

const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, jwtConfig.secret);
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });

  if (!tokenDoc) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token not found');
  }

  return tokenDoc;
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
};
