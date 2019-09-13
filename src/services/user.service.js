const bcrypt = require('bcryptjs');
const httpStatus = require('http-status');
const { AppError } = require('../utils/error.util');
const { User, Task } = require('../models');
const { getQueryFilter, getQueryOptions } = require('../utils/service.util');

const checkDuplicateEmail = async (email, excludeUserId) => {
  const user = await User.findOne({ email, _id: { $ne: excludeUserId } });
  if (user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is already used');
  }
};

const createUser = async userBody => {
  await checkDuplicateEmail(userBody.email);
  const user = new User(userBody);
  await user.save();
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
  await checkDuplicateEmail(updateBody.email, userId);
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

const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

const getUsers = async query => {
  const filter = getQueryFilter(query, ['name', 'role']);
  const options = getQueryOptions(query);

  const users = await User.find(filter, null, options);
  return users;
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
  getUsers,
};
