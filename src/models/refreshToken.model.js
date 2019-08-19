const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const Boom = require('boom');
const { pick } = require('lodash');
const { jwt: jwtConfig } = require('../config/config');

const refreshTokenSchema = mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
});

refreshTokenSchema.statics.generate = async function(user) {
  const userId = user._id;
  const expires = moment().add(jwtConfig.refreshExpirationDays, 'days');
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
  };
  const token = jwt.sign(payload, jwtConfig.secret);

  const refreshToken = new RefreshToken({ token, user: userId, expires: expires.toDate() });
  try {
    await refreshToken.save();
  } catch (error) {
    throw Boom.badImplementation();
  }

  return refreshToken;
};

refreshTokenSchema.methods.transform = function() {
  const refreshToken = this;
  return pick(refreshToken, ['token', 'expires']);
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
