const httpStatus = require('http-status');
const { userService, tokenService } = require('../services');
const { catchAsync } = require('../utils/controller.util');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user._id);
  const response = {
    user: user.transform(),
    tokens,
  };
  res.status(httpStatus.CREATED).send(response);
});

const login = catchAsync(async (req, res) => {
  const user = await userService.loginUser(req.body.email, req.body.password);
  const tokens = await tokenService.generateAuthTokens(user._id);
  const response = {
    user: user.transform(),
    tokens,
  };
  res.send(response);
});

const refreshTokens = catchAsync(async (req, res) => {
  const refreshTokenDoc = await tokenService.verifyRefreshToken(req.body.refreshToken);
  const tokens = await tokenService.generateAuthTokens(refreshTokenDoc.user);
  const response = { ...tokens };
  res.send(response);
});

const resetPassword = catchAsync(async (req, res) => {
  const { resetPasswordToken } = req.params;
  const resetPasswordTokenDoc = await tokenService.verifyResetPasswordToken(resetPasswordToken);
  await userService.updateUser(resetPasswordTokenDoc.user, { password: req.body.password });
  await tokenService.deleteToken(resetPasswordToken);
  await tokenService.deleteAllRefreshTokensOfUser(resetPasswordTokenDoc.user);
  res.status(httpStatus.NO_CONTENT).send();
});

const logoutAll = catchAsync(async (req, res) => {
  await tokenService.deleteAllRefreshTokensOfUser(req.user._id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  refreshTokens,
  logoutAll,
  resetPassword,
};
