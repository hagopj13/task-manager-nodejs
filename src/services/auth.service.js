const bcrypt = require('bcryptjs');
const moment = require('moment');
const httpStatus = require('http-status');
const { jwt: jwtConfig } = require('../config/config');
const userService = require('./user.service');
const tokenService = require('./token.service');
const { Token } = require('../models');
const { AppError } = require('../utils/error.util');

const checkPassword = async (password, correctPassword) => {
  const isPasswordMatch = await bcrypt.compare(password, correctPassword);
  if (!isPasswordMatch) {
    throw new Error('Passwords do not match');
  }
};

const loginUser = async (email, password) => {
  try {
    const user = await userService.getUserByEmail(email);
    await checkPassword(password, user.password);
    return user;
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
};

const generateAuthTokens = async userId => {
  const accessTokenExpires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
  const accessToken = tokenService.generateToken(userId, accessTokenExpires);

  const refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');
  const refreshToken = tokenService.generateToken(userId, refreshTokenExpires);
  await tokenService.createToken(refreshToken, userId, refreshTokenExpires, 'refresh');

  return {
    accessToken: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refreshToken: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const refreshTokens = async refreshToken => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
    const userId = refreshTokenDoc.user;
    await userService.getUser(userId);
    await refreshTokenDoc.remove();
    const newTokens = await generateAuthTokens(userId);
    return newTokens;
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

const deleteUserRefreshTokens = async userId => {
  await Token.deleteMany({ user: userId, type: 'refresh' });
};

const deleteUserResetPasswordTokens = async userId => {
  await Token.deleteMany({ user: userId, type: 'resetPassword' });
};

const forgotPassword = async email => {
  const user = userService.getUserByEmail(email);
  const expires = moment().add(jwtConfig.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = tokenService.generateToken(user._id, expires);
  await tokenService.createToken(resetPasswordToken, user._id, expires, 'resetPassword');
};

const resetPassword = async (resetPasswordToken, newPassword) => {
  let userId;
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, 'resetPassword');
    userId = resetPasswordTokenDoc.user;
    await userService.updateUser(userId, { password: newPassword });
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
  await deleteUserResetPasswordTokens(userId);
  await deleteUserRefreshTokens(userId);
};

module.exports = {
  loginUser,
  generateAuthTokens,
  refreshTokens,
  deleteUserRefreshTokens,
  forgotPassword,
  resetPassword,
};
