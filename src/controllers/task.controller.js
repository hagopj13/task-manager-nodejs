const httpStatus = require('http-status');
const Boom = require('boom');
const { Task } = require('../models');
const { catchAsync } = require('../utils/controller.utils');

const createTask = catchAsync(async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });
  await task.save();
  res.status(httpStatus.CREATED).send(task.transform());
});

const getTaskOfUser = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, owner: userId });
  if (!task) {
    throw Boom.notFound('Task not found');
  }
  return task;
};

const getTask = catchAsync(async (req, res) => {
  const task = await getTaskOfUser(req.params.taskId, req.user._id);
  res.send(task.transform());
});

const updateTask = catchAsync(async (req, res) => {
  const task = await getTaskOfUser(req.params.taskId, req.user._id);
  Object.keys(req.body).forEach(update => (task[update] = req.body[update]));
  await task.save();
  res.send(task.transform());
});

const deleteTask = catchAsync(async (req, res) => {
  const task = await getTaskOfUser(req.params.taskId, req.user._id);
  await task.remove();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
};
