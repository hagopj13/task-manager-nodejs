const mongoose = require('mongoose');
const moment = require('moment');
const { jwt: jwtConfig } = require('../../config/config');
const { User, RefreshToken } = require('../../models');
const { generateToken } = require('../../utils/auth.util');

const accessTokenExpires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
const refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');

const userOne = {
  _id: mongoose.Types.ObjectId(),
  name: 'User One',
  email: 'user1@example.com',
  password: 'Red1234!',
};
const userOneAccessToken = generateToken(userOne._id, accessTokenExpires);
const userOneRefreshToken = generateToken(userOne._id, refreshTokenExpires);
const userOneRefreshTokenObj = {
  token: userOneRefreshToken,
  user: userOne._id,
  expires: refreshTokenExpires.toDate(),
};

const userTwo = {
  _id: mongoose.Types.ObjectId(),
  name: 'User Two',
  email: 'user2@example.com',
  password: 'Blue1234!',
};

const setupUsers = async () => {
  await new User(userOne).save();
  await new User(userTwo).save();
  await new RefreshToken(userOneRefreshTokenObj).save();
};

module.exports = {
  userOne,
  userOneAccessToken,
  userOneRefreshToken,
  userTwo,
  setupUsers,
};
