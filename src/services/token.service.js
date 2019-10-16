const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const { AppError } = require('../utils/error.util');
const { jwt: jwtConfig } = require('../config/config');
const { getUser } = require('../services/user.service');
const { generateToken } = require('../utils/token.util');
const { Token } = require('../models');

const createToken = async (token, userId, type, expires) => {
  const tokenDoc = await Token.create({
    token,
    type,
    user: userId,
    expires: expires.toDate(),
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

const generateAccessToken = user => {
  const expires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
  const token = generateToken(user._id, expires);
  return { token, expires: expires.toDate() };
};

const generateRefreshToken = async user => {
  const expires = moment().add(jwtConfig.refreshExpirationDays, 'days');
  const token = generateToken(user._id, expires);
  const refreshTokenDoc = await createToken(token, user._id, 'refresh', expires);
  return refreshTokenDoc.transform();
};

const generateAuthTokens = async user => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);
  return { accessToken, refreshToken };
};

const unauthorizedError = new AppError(httpStatus.UNAUTHORIZED, 'Please authenticate');
const verifyRefreshToken = async refreshToken => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, 'refresh');
    await refreshTokenDoc.remove();
    const user = await getUser(refreshTokenDoc.user);
    return user;
  } catch (error) {
    throw unauthorizedError;
  }
};

const deleteAllRefreshTokensOfUser = async user => {
  await Token.deleteMany({ user: user._id, type: 'refresh' });
};

module.exports = {
  generateAuthTokens,
  verifyRefreshToken,
  deleteAllRefreshTokensOfUser,
};
