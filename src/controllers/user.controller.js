const httpStatus = require('http-status');
const { catchAsync } = require('../utils/controller.utils');
const User = require('../models/user.model');

const getCurrentUser = catchAsync(async (req, res) => {
  res.send(req.user.transform());
});

const updateCurrentUser = catchAsync(async (req, res) => {
  await User.checkDuplicateEmail(req.body.email, req.user._id);
  Object.keys(req.body).forEach(update => (req.user[update] = req.body[update]));
  await req.user.save();
  res.send(req.user.transform());
});

const deleteCurrentUser = catchAsync(async (req, res) => {
  await req.user.remove();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
};
