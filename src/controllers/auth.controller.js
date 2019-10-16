const httpStatus = require('http-status');
const { userService, authService } = require('../services');
const { catchAsync } = require('../utils/controller.util');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await authService.generateAuthTokens(user._id);
  const response = {
    user: user.transform(),
    tokens,
  };
  res.status(httpStatus.CREATED).send(response);
});

const login = catchAsync(async (req, res) => {
  const user = await authService.loginUser(req.body.email, req.body.password);
  const tokens = await authService.generateAuthTokens(user._id);
  const response = {
    user: user.transform(),
    tokens,
  };
  res.send(response);
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshTokens(req.body.refreshToken);
  const response = { ...tokens };
  res.send(response);
});

const logoutAll = catchAsync(async (req, res) => {
  await authService.deleteUserRefreshTokens(req.user._id);
  res.status(httpStatus.NO_CONTENT).send();
});

const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.params.resetPasswordToken, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  refreshTokens,
  logoutAll,
  forgotPassword,
  resetPassword,
};
