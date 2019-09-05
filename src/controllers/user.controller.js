const httpStatus = require('http-status');
const Boom = require('boom');
const { User } = require('../models');
const { catchAsync } = require('../utils/controller.utils');

const getUserById = async userId => {
  const user = await User.findById(userId);
  if (!user) {
    throw Boom.notFound('User not found');
  }
  return user;
};

const getUser = catchAsync(async (req, res) => {
  const user = await getUserById(req.params.userId);
  res.send(user.transform());
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
  getUser,
  updateCurrentUser,
  deleteCurrentUser,
};
