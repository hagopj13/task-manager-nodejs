const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Boom = require('boom');
const moment = require('moment');
const { pick, omit } = require('lodash');
const { jwt: jwtConfig } = require('../config/config');
const RefreshToken = require('./refreshToken.model');
const { generateToken } = require('../utils/auth.util');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password must not contain the word "password"');
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.statics.checkDuplicateEmail = async function(email) {
  const user = await User.findOne({ email });
  if (user) {
    throw Boom.badRequest('Email is already used');
  }
};

userSchema.statics.findByCredentials = async function(email, password) {
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

userSchema.methods.generateAuthTokens = async function() {
  const user = this;
  const expires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
  const token = generateToken(user._id, expires);

  const accessToken = { token, expires: expires.toDate() };
  const refreshToken = await RefreshToken.generate(user);

  return {
    accessToken,
    refreshToken: refreshToken.transform(),
  };
};

userSchema.methods.toJSON = function() {
  const user = this;
  return omit(user.toObject(), ['password']);
};

userSchema.methods.transform = function() {
  const user = this;
  return pick(user, ['id', 'email', 'name', 'age']);
};

userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
