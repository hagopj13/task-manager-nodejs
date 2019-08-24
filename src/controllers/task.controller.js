const httpStatus = require('http-status');
const Task = require('../models/task.model');
const { catchAsync } = require('../utils/controller.utils');

const createTask = catchAsync(async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });
  await task.save();
  res.status(httpStatus.CREATED).send(task.transform());
});

module.exports = {
  createTask,
};
