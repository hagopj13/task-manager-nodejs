const httpStatus = require('http-status');
const User = require('../models/user.model');
const asyncController = require('../middlewares/controller');

const register = asyncController(async (req, res) => {
  await User.checkDuplicateEmail(req.body.email);
  const user = new User(req.body);
  await user.save();
  res.status(httpStatus.CREATED).send({ user });
});

module.exports = {
  register,
};
