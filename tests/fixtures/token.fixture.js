const moment = require('moment');
const { jwt: jwtConfig } = require('../../src/config/config');
const { Token } = require('../../src/models');
const { generateToken } = require('../../src/utils/token.util');
const { userOne } = require('./user.fixture');

const refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');

const userOneRefreshToken = {
  token: generateToken(userOne._id, refreshTokenExpires),
  user: userOne._id,
  type: 'refresh',
  expires: refreshTokenExpires.toDate(),
};

const allRefreshTokens = [userOneRefreshToken];

const insertToken = async token => {
  await Token.create(token);
};

const insertAllRefreshTokens = async () => {
  await Token.insertMany(allRefreshTokens);
};

module.exports = {
  userOneRefreshToken,
  allRefreshTokens,
  insertToken,
  insertAllRefreshTokens,
};
