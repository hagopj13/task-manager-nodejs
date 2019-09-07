const { User, RefreshToken, Task } = require('../../src/models');
const { setupUsers } = require('./user.fixture');
const { setupTasks } = require('./task.fixture');

const resetDatabase = async () => {
  await User.deleteMany();
  await RefreshToken.deleteMany();
  await Task.deleteMany();
  await setupUsers();
  await setupTasks();
};

module.exports = {
  resetDatabase,
};
