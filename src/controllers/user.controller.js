const User = require('../models/user.model');
const asyncController = require('../middlewares/controller');

const signUp = asyncController(async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).send({ user });
});

module.exports = {
  signUp,
};
