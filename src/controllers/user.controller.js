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

const updateUser = catchAsync(async (req, res) => {
  const user = await getUserById(req.params.userId);
  await User.checkDuplicateEmail(req.body.email, user._id);
  Object.keys(req.body).forEach(update => (user[update] = req.body[update]));
  await user.save();
  res.send(user.transform());
});

const deleteCurrentUser = catchAsync(async (req, res) => {
  await req.user.remove();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getUser,
  updateUser,
  deleteCurrentUser,
};
