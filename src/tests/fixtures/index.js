const mongoose = require('mongoose');
const { setupUsers } = require('./user.fixtures');

const resetDatabase = async () => {
  await mongoose.connection.db.dropDatabase();
  await setupUsers();
};

module.exports = {
  resetDatabase,
};
