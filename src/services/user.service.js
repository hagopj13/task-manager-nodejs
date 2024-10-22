const httpStatus = require('http-status');
const { pick } = require('lodash');
const { AppError } = require('../utils/error.util');
const { User, Task } = require('../models');
const { getQueryOptions } = require('../utils/service.util');

const checkDuplicateEmail = async (email, excludeUserId) => {
  const user = await User.findOne({ email, _id: { $ne: excludeUserId } });
  if (user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is already used');
  }
};

const createUser = async userBody => {
  await checkDuplicateEmail(userBody.email);
  const user = await User.create(userBody);
  return user;
};

const getUser = async userId => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

const updateUser = async (userId, updateBody) => {
  const user = await getUser(userId);
  if (updateBody.email) {
    await checkDuplicateEmail(updateBody.email, userId);
  }
  Object.keys(updateBody).forEach(update => (user[update] = updateBody[update]));
  await user.save();
  return user;
};

const deleteUser = async userId => {
  await Task.deleteMany({ owner: userId });
  const user = await getUser(userId);
  await user.remove();
  return user;
};

const getUsers = async query => {
  const filter = pick(query, ['name', 'role']);
  const options = getQueryOptions(query);

  const users = await User.find(filter, null, options);
  return users;
};

const getUserByEmail = async email => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'No user found with this email');
  }
  return user;
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getUsers,
  getUserByEmail,
};
