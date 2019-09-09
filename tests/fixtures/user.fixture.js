const mongoose = require('mongoose');
const moment = require('moment');
const { jwt: jwtConfig } = require('../../src/config/config');
const { User } = require('../../src/models');
const { generateToken } = require('../../src/utils/auth.util');

const accessTokenExpires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');

const userOne = {
  _id: mongoose.Types.ObjectId(),
  name: 'User One',
  email: 'user1@example.com',
  password: 'Red1234!',
  role: 'user',
};

const userTwo = {
  _id: mongoose.Types.ObjectId(),
  name: 'User Two',
  email: 'user2@example.com',
  password: 'Blue1234!',
  role: 'user',
};

const admin = {
  _id: mongoose.Types.ObjectId(),
  name: 'Admin',
  email: 'admin@example.com',
  password: 'Green1234!',
  role: 'admin',
};

const allUsers = [userOne, userTwo, admin];

const userOneAccessToken = generateToken(userOne._id, accessTokenExpires);
const adminAccessToken = generateToken(admin._id, accessTokenExpires);

const insertUser = async user => {
  await new User(user).save();
};

const insertAllUsers = async () => {
  for (const user of allUsers) {
    await insertUser(user);
  }
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
