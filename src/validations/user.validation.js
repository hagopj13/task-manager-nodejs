const Joi = require('@hapi/joi');

const register = {
  body: {
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
  },
};

module.exports = {
  register,
};
