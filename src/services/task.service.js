const Boom = require('boom');
const { Task } = require('../models');
const { getFilterOptions } = require('../utils/service.util');

const createTask = async (taskBody, userId) => {
  const task = new Task({ ...taskBody, owner: userId });
  await task.save();
  return task;
};

const getTask = async (taskId, userId) => {
  const task = await Task.findOne({ _id: taskId, owner: userId });
  if (!task) {
    throw Boom.notFound('Task not found');
  }
  return task;
};

const updateTask = async (taskId, updateBody, userId) => {
  const task = await getTask(taskId, userId);
  Object.keys(updateBody).forEach(update => (task[update] = updateBody[update]));
  await task.save();
  return task;
};

const deleteTask = async (taskId, userId) => {
  const task = await getTask(taskId, userId);
  await task.remove();
  return task;
};

const getTasks = async (query, userId) => {
  const options = getFilterOptions(query);
  const filter = { owner: userId };
  if (typeof query.completed !== 'undefined') {
    filter.completed = query.completed === true;
  }

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
