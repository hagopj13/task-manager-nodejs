const Joi = require('@hapi/joi');

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    email: Joi.string().email(),
    password: Joi.string().min(8).regex(/^((?!password).)*$/im),
    name: Joi.string().max(128),
    age: Joi.number().integer().min(0),
  }).min(1),
};

module.exports = {
  getUser,
  updateUser,
};
