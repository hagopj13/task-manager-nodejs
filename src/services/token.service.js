const Boom = require('boom');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { jwt: jwtConfig } = require('../config/config');
const { User } = require('../models');
const { generateToken } = require('../utils/auth.util');
const { RefreshToken } = require('../models');

const unauthorizedError = Boom.unauthorized('Please authenticate');

const generateAccessToken = user => {
  const expires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
  const token = generateToken(user._id, expires);
  return { token, expires: expires.toDate() };
};

const generateRefreshToken = async user => {
  const expires = moment().add(jwtConfig.refreshExpirationDays, 'days');
  const token = generateToken(user._id, expires);
  const refreshToken = new RefreshToken({ token, user: user._id, expires: expires.toDate() });
  await refreshToken.save();
  return refreshToken.transform();
};

const generateAuthTokens = async user => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);
  return { accessToken, refreshToken };
};

const verifyRefreshToken = async token => {
  try {
    const payload = jwt.verify(token, jwtConfig.secret);
    const refreshToken = await RefreshToken.findOneAndDelete({
      token,
      user: payload.sub,
      blacklisted: false,
    });
    if (!refreshToken || moment(refreshToken.expires).isBefore()) {
      throw unauthorizedError;
    }
    return refreshToken;
  } catch (error) {
    throw unauthorizedError;
  }
};

const verifyAndGenerateAuthTokens = async refreshToken => {
  const refreshTokenDoc = await verifyRefreshToken(refreshToken);
  const user = await User.findById(refreshTokenDoc.user);
  if (!user) {
    throw unauthorizedError;
  }
  const newAuthTokens = await generateAuthTokens(user);
  return newAuthTokens;
};

const deleteAllRefreshTokensOfUser = async user => {
  await RefreshToken.deleteMany({ user: user._id });
};

module.exports = {
  generateAuthTokens,
  verifyAndGenerateAuthTokens,
  deleteAllRefreshTokensOfUser,
};
