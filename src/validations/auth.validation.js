const Joi = require('../utils/validation.util');

const register = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).regex(/^((?!password).)*$/im).required(),
    name: Joi.string().max(128).required(),
    age: Joi.number().integer().min(0),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const resetPassword = {
  params: Joi.object().keys({
    resetPasswordToken: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().min(8).regex(/^((?!password).)*$/im).required(),
  }),
}

module.exports = {
  register,
  login,
  refreshTokens,
  resetPassword,
};
