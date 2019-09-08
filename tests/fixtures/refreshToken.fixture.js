const moment = require('moment');
const { jwt: jwtConfig } = require('../../src/config/config');
const { RefreshToken } = require('../../src/models');
const { generateToken } = require('../../src/utils/auth.util');
const { userOne } = require('./user.fixture');

const refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');

const userOneRefreshToken = {
  token: generateToken(userOne._id, refreshTokenExpires),
  user: userOne._id,
  expires: refreshTokenExpires.toDate(),
};

const allRefreshTokens = [userOneRefreshToken];

const insertRefreshToken = async refreshToken => {
  await new RefreshToken(refreshToken).save();
};

const insertAllRefreshTokens = async () => {
  for (const refreshToken of allRefreshTokens) {
    await insertRefreshToken(refreshToken);
  }
};

module.exports = {
  userOneRefreshToken,
  allRefreshTokens,
  insertRefreshToken,
  insertAllRefreshTokens,
};
