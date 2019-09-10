const Boom = require('boom');
const { Task } = require('../models');
const { getQueryFilter, getQueryOptions } = require('../utils/service.util');

const createTask = async (taskBody, user) => {
  const task = new Task({ ...taskBody, owner: user._id });
  await task.save();
  return task;
};

const getTask = async (taskId, user) => {
  const filter = {
    _id: taskId,
    ...(user.role !== 'admin' && { owner: user._id }),
  };
  const task = await Task.findOne(filter);
  if (!task) {
    throw Boom.notFound('Task not found');
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
