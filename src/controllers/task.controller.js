const httpStatus = require('http-status');
const { taskService } = require('../services');
const { catchAsync } = require('../utils/controller.utils');

const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask({ ...req.body, owner: req.user._id });
  const response = task.transform();
  res.status(httpStatus.CREATED).send(response);
});

const getTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getTasks(req.query, req.user._id);
  const response = tasks.map(task => task.transform());
  res.send(response);
});

const getTask = catchAsync(async (req, res) => {
  const task = await taskService.getTask(req.params.taskId, req.user._id);
  const response = task.transform();
  res.send(response);
});

const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(req.params.taskId, req.body, req.user._id);
  const response = task.transform();
  res.send(response);
});

const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.taskId, req.user._id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
};
