const { catchAsync } = require('../utils/controller.utils');
const User = require('../models/user.model');

const getCurrentUser = catchAsync(async (req, res) => {
  res.send(req.user.transform());
});

const updateCurrentUser = catchAsync(async (req, res) => {
  await User.checkDuplicateEmail(req.body.email, req.user._id);
  Object.keys(req.body).forEach(update => (req.user[update] = req.body[update]));
  await req.user.save();
  res.send(req.user.transform());
});

module.exports = {
  getCurrentUser,
  updateCurrentUser,
};
