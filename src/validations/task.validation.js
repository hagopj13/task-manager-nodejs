const Joi = require('@hapi/joi');

const createTask = {
  body: Joi.object().keys({
    description: Joi.string().required(),
    completed: Joi.boolean(),
  }),
};

module.exports = {
  createTask,
}
