const User = require('../../models/user.model');
const RefreshToken = require('../../models/refreshToken.model');
const Task = require('../../models/task.model');
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
