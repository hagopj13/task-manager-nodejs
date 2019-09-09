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

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().required(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    skip: Joi.number().integer(),
  }),
}

module.exports = {
  getUser,
  updateUser,
  deleteUser,
  getUsers,
};
