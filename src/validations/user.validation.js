const Joi = require('../utils/validation.util');

const getUser = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.objectId().required(),
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
    userId: Joi.objectId().required(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
}

module.exports = {
  getUser,
  updateUser,
  deleteUser,
  getUsers,
};
