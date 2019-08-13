const httpStatus = require('http-status');
const { pick } = require('lodash');
const User = require('../models/user.model');
const asyncController = require('../middlewares/controller');

const register = asyncController(async (req, res) => {
  await User.checkDuplicateEmail(req.body.email);
  const user = new User(req.body);
  await user.save();
  const response = {
    user: pick(user, ['id', 'name', 'email', 'age']),
  };
  res.status(httpStatus.CREATED).send(response);
});

const login = asyncController(async (req, res) => {
  const user = await User.findByCredentials(req.body.email, req.body.password);
  const response = {
    user: pick(user, ['id', 'name', 'email', 'age']),
  };
  res.send(response);
});

module.exports = {
  register,
  login,
};
