/* eslint consistent-return: 0 */
const Joi = require('@hapi/joi');
const Boom = require('boom');

const validate = schema => (req, res, next) => {
  if (!schema) {
    return next();
  }

  const toValidate = {};
  [('params', 'query', 'body')].forEach(key => {
    if (schema[key]) {
      toValidate[key] = req[key];
    }
  });

  Joi.validate(toValidate, schema, err => {
    if (err) {
      throw Boom.badRequest(err.message, err.details);
    }
    next();
  });
};

module.exports = validate;
