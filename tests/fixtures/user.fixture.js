const mongoose = require('mongoose');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const { jwt: jwtConfig } = require('../../src/config/config');
const { User } = require('../../src/models');
const { generateToken } = require('../../src/utils/token.util');

const accessTokenExpires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');

const password = 'Red1234!';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  _id: mongoose.Types.ObjectId(),
  name: 'User One',
  email: 'user1@example.com',
  password,
  role: 'user',
};

const userTwo = {
  _id: mongoose.Types.ObjectId(),
  name: 'User Two',
  email: 'user2@example.com',
  password,
  role: 'user',
};

const admin = {
  _id: mongoose.Types.ObjectId(),
  name: 'Admin',
  email: 'admin@example.com',
  password,
  role: 'admin',
};

const allUsers = [userOne, userTwo, admin];

const userOneAccessToken = generateToken(userOne._id, accessTokenExpires);
const adminAccessToken = generateToken(admin._id, accessTokenExpires);

const insertUser = async user => {
  await User.create(user);
};

const insertAllUsers = async () => {
  await User.insertMany(allUsers.map(user => ({ ...user, password: hashedPassword })));
};

module.exports = {
  userOne,
  userTwo,
  admin,
  userOneAccessToken,
  adminAccessToken,
  allUsers,
  insertUser,
  insertAllUsers,
};
