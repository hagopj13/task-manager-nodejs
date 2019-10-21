const { User, Token, Task } = require('../../src/models');

const clearDatabase = async () => {
  await User.deleteMany();
  await Token.deleteMany();
  await Task.deleteMany();
};

module.exports = {
  clearDatabase,
};
