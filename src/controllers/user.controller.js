const asyncController = require('../middlewares/controller');

const currentUser = asyncController(async (req, res) => {
  res.send(req.user.transform());
});

module.exports = {
  currentUser,
};
