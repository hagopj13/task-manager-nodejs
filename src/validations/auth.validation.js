const Joi = require('@hapi/joi');

const register = {
  body: Joi.object().keys({
    email: Joi.string()
      .email()
      .required(),
    password: Joi.string()
      .min(8)
      .regex(/^((?!password).)*$/im)
      .required(),
    name: Joi.string()
      .max(128)
      .required(),
    age: Joi.number()
      .integer()
      .min(0),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const refresh = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  refresh,
};
