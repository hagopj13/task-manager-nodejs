const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Boom = require('boom');

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

userSchema.methods.toJSON = function() {
  const user = this;
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
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
