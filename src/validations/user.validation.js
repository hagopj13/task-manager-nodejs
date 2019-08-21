const Joi = require('@hapi/joi');

const updateUserBody = Joi.object().keys({
  email: Joi.string().email(),
  password: Joi.string().min(8).regex(/^((?!password).)*$/im),
  name: Joi.string().max(128),
  age: Joi.number().integer().min(0),
}).min(1);

const updateCurrentUser = {
  body: updateUserBody,
};

module.exports = {
  updateCurrentUser,
};
