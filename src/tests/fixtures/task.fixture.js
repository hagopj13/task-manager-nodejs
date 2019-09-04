const mongoose = require('mongoose');
const { Task } = require('../../models');
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

const setupTasks = async () => {
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
  await new Task(taskFour).save();
};

module.exports = {
  taskOne,
  taskTwo,
  taskThree,
  taskFour,
  userOneTasks,
  setupTasks,
};
