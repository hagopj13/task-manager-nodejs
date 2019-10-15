const httpStatus = require('http-status');
const { userService, tokenService } = require('../services');
const { catchAsync } = require('../utils/controller.util');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  const response = {
    user: user.transform(),
    tokens,
  };
  res.status(httpStatus.CREATED).send(response);
});

const login = catchAsync(async (req, res) => {
  const user = await userService.loginUser(req.body.email, req.body.password);
  const tokens = await tokenService.generateAuthTokens(user);
  const response = {
    user: user.transform(),
    tokens,
  };
  res.send(response);
});

const refreshTokens = catchAsync(async (req, res) => {
  const user = await tokenService.verifyRefreshToken(req.body.refreshToken);
  const tokens = await tokenService.generateAuthTokens(user);
  const response = { ...tokens };
  res.send(response);
});

const logoutAll = catchAsync(async (req, res) => {
  await tokenService.deleteAllRefreshTokensOfUser(req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  refreshTokens,
  logoutAll,
};
