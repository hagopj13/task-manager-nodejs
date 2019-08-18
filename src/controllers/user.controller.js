const { pick } = require('lodash');
const asyncController = require('../middlewares/controller');

const me = asyncController(async (req, res) => {
  const response = pick(req.user, ['id', 'name', 'email', 'age']);
  res.send(response);
});

module.exports = {
  me,
};
