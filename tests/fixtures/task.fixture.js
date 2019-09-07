const mongoose = require('mongoose');
const { Task } = require('../../src/models');
const { userOne, userTwo } = require('./user.fixture');

const taskOne = {
  _id: mongoose.Types.ObjectId(),
  description: 'First task',
  completed: false,
  owner: userOne._id,
};

const taskTwo = {
  _id: mongoose.Types.ObjectId(),
  description: 'Second task',
  completed: false,
  owner: userOne._id,
};

const taskThree = {
  _id: mongoose.Types.ObjectId(),
  description: 'Third task',
  completed: true,
  owner: userOne._id,
};

const taskFour = {
  _id: mongoose.Types.ObjectId(),
  description: 'Fourth task',
  completed: false,
  owner: userTwo._id,
};

const userOneTasks = [taskOne, taskTwo, taskThree];
const allTasks = [taskOne, taskTwo, taskThree, taskFour];

const setupTasks = async () => {
  allTasks.forEach(async task => {
    const taskDoc = new Task(task);
    await taskDoc.save();
  });
};

module.exports = {
  taskOne,
  taskTwo,
  taskThree,
  taskFour,
  userOneTasks,
  allTasks,
  setupTasks,
};
