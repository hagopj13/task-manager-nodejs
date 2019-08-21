const { catchAsync } = require('../utils/controller.utils');

const currentUser = catchAsync(async (req, res) => {
  res.send(req.user.transform());
});

module.exports = {
  currentUser,
};
