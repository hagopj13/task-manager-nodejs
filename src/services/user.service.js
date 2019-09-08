const Boom = require('boom');
const bcrypt = require('bcryptjs');
const { User, Task } = require('../models');

const checkDuplicateEmail = async (email, excludeUserId) => {
  const user = await User.findOne({ email, _id: { $ne: excludeUserId } });
  if (user) {
    throw Boom.badRequest('Email is already used');
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
    throw Boom.notFound('User not found');
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
    throw Boom.unauthorized('Incorrect email or password');
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw Boom.unauthorized('Incorrect email or password');
  }
  return user;
};

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
  loginUser,
};
