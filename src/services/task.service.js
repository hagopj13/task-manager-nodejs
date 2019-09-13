const httpStatus = require('http-status');
const { AppError } = require('../utils/error.util');
const { Task } = require('../models');
const { getQueryFilter, getQueryOptions } = require('../utils/service.util');

const createTask = async (taskBody, user) => {
  const task = await Task.create({ ...taskBody, owner: user._id });
  return task;
};

const getTask = async (taskId, user) => {
  const filter = {
    _id: taskId,
    ...(user.role !== 'admin' && { owner: user._id }),
  };
  const task = await Task.findOne(filter);
  if (!task) {
    throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
  }
  return task;
};

const updateTask = async (taskId, updateBody, user) => {
  const task = await getTask(taskId, user);
  Object.keys(updateBody).forEach(update => (task[update] = updateBody[update]));
  await task.save();
  return task;
};

const deleteTask = async (taskId, user) => {
  const task = await getTask(taskId, user);
  await task.remove();
  return task;
};

const getTasks = async (query, user) => {
  const filter = getQueryFilter(query, ['completed']);
  Object.assign(filter, user.role !== 'admin' ? { owner: user._id } : {});
  const options = getQueryOptions(query);

  const tasks = await Task.find(filter, null, options);
  return tasks;
};

module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getTasks,
};
