const Joi = require('@hapi/joi');

const createTask = {
  body: Joi.object().keys({
    description: Joi.string().required(),
    completed: Joi.boolean(),
  }),
};

const getTask = {
  params: Joi.object().keys({
    taskId: Joi.string().required(),
  }),
};

const updateTask = {
  params: Joi.object().keys({
    taskId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    description: Joi.string(),
    completed: Joi.boolean(),
  }).min(1),
};

const deleteTask = {
  params: Joi.object().keys({
    taskId: Joi.string().required(),
  }),
};

module.exports = {
  createTask,
  getTask,
  updateTask,
  deleteTask,
}
