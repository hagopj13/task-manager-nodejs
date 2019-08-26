const mongoose = require('mongoose');
const { setupUsers } = require('./user.fixture');
const { setupTasks } = require('./task.fixture');

const resetDatabase = async () => {
  await mongoose.connection.db.dropDatabase();
  await setupUsers();
  await setupTasks();
};

module.exports = {
  resetDatabase,
};
