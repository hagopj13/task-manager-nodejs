const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const { AppError } = require('../utils/error.util');
const { jwt: jwtConfig } = require('../config/config');
const { User } = require('../models');
const { generateToken } = require('../utils/token.util');
const { RefreshToken } = require('../models');

const unauthorizedError = new AppError(httpStatus.UNAUTHORIZED, 'Please authenticate');

const generateAccessToken = user => {
  const expires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
  const token = generateToken(user._id, expires);
  return { token, expires: expires.toDate() };
};

const generateRefreshToken = async user => {
  const expires = moment().add(jwtConfig.refreshExpirationDays, 'days');
  const token = generateToken(user._id, expires);
  const refreshToken = await RefreshToken.create({
    token,
    user: user._id,
    expires: expires.toDate(),
  });
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

const verifyAndGenerateAuthTokens = async token => {
  const refreshToken = await verifyRefreshToken(token);
  const user = await User.findById(refreshToken.user);
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
