const mongoose = require('mongoose');
const User = require('../../../models/user.model');

const userOneId = mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: 'User One',
  email: 'user1@example.com',
  password: 'Red1234!',
};

const userTwoId = mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: 'User Two',
  email: 'user2@example.com',
  password: 'Blue1234!',
};

const setupUsers = async () => {
  await User.deleteMany();
  await new User(userOne).save();
  await new User(userTwo).save();
};

module.exports = {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  setupUsers,
};
