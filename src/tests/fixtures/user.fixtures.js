const mongoose = require('mongoose');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../../config/config');
const User = require('../../models/user.model');
const RefreshToken = require('../../models/refreshToken.model');

const accessTokenExpires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
const refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');
const generateToken = (_id, expires, secret = jwtConfig.secret) => {
  const payload = {
    sub: _id.toHexString(),
    iat: moment().unix(),
    exp: expires.unix(),
  };
  return jwt.sign(payload, secret);
};

const userOneId = mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: 'User One',
  email: 'user1@example.com',
  password: 'Red1234!',
};
const userOneAccessToken = generateToken(userOneId, accessTokenExpires);
const userOneRefreshToken = generateToken(userOneId, refreshTokenExpires);
const userOneRefreshTokenObj = {
  token: userOneRefreshToken,
  user: userOneId,
  expires: refreshTokenExpires.toDate(),
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
  await RefreshToken.deleteMany();
  await new User(userOne).save();
  await new User(userTwo).save();
  await new RefreshToken(userOneRefreshTokenObj).save();
};

module.exports = {
  userOneId,
  userOne,
  userOneAccessToken,
  userOneRefreshToken,
  userTwoId,
  userTwo,
  setupUsers,
  generateToken,
};
