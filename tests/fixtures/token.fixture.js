const moment = require('moment');
const { jwt: jwtConfig } = require('../../src/config/config');
const { Token } = require('../../src/models');
const { generateToken } = require('../../src/services/token.service');
const { userOne } = require('./user.fixture');

const refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');

const userOneRefreshToken = {
  token: generateToken(userOne._id, refreshTokenExpires),
  user: userOne._id,
  type: 'refresh',
  expires: refreshTokenExpires.toDate(),
};

const resetPasswordTokenExpires = moment().add(jwtConfig.resetPasswordExpirationMinutes, 'minutes');
const userOneResetPasswordToken = {
  token: generateToken(userOne._id, resetPasswordTokenExpires),
  user: userOne._id,
  type: 'resetPassword',
  expires: resetPasswordTokenExpires.toDate(),
};

const allRefreshTokens = [userOneRefreshToken];
const allResetPasswordTokens = [userOneResetPasswordToken];

const insertToken = async token => {
  await Token.create(token);
};

const insertAllRefreshTokens = async () => {
  await Token.insertMany(allRefreshTokens);
};

const insertAllResetPasswordTokens = async () => {
  await Token.insertMany(allResetPasswordTokens);
};

module.exports = {
  userOneRefreshToken,
  allRefreshTokens,
  allResetPasswordTokens,
  insertToken,
  insertAllRefreshTokens,
  insertAllResetPasswordTokens,
};
