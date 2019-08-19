const httpStatus = require('http-status');
const User = require('../models/user.model');
const asyncController = require('../middlewares/controller');

const register = asyncController(async (req, res) => {
  await User.checkDuplicateEmail(req.body.email);
  const user = new User(req.body);
  await user.save();
  const tokens = await user.generateAuthTokens();
  const response = {
    user: user.transform(),
    tokens,
  };
  res.status(httpStatus.CREATED).send(response);
});

const login = asyncController(async (req, res) => {
  const user = await User.findByCredentials(req.body.email, req.body.password);
  const tokens = await user.generateAuthTokens();
  const response = {
    user: user.transform(),
    tokens,
  };
  res.send(response);
});

module.exports = {
  register,
  login,
};
