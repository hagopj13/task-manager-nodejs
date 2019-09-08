const httpStatus = require('http-status');
const { userService } = require('../services');
const { catchAsync } = require('../utils/controller.utils');

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUser(req.params.userId);
  res.send(user.transform());
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.userId, req.body);
  res.send(user.transform());
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getUser,
  updateUser,
  deleteUser,
};
