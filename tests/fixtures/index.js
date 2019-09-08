const { User, RefreshToken, Task } = require('../../src/models');

const clearDatabase = async () => {
  await User.deleteMany();
  await RefreshToken.deleteMany();
  await Task.deleteMany();
};

module.exports = {
  clearDatabase,
};
