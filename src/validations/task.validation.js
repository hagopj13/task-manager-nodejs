const Joi = require('@hapi/joi');

const createTask = {
  body: Joi.object().keys({
    description: Joi.string().required(),
    completed: Joi.boolean(),
  }),
};

const getTask = {
  params: Joi.object().keys({
    taskId: Joi.string().required()
  })
}

module.exports = {
  createTask,
  getTask,
}
