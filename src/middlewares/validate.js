/* eslint consistent-return: 0 */
const Joi = require('@hapi/joi');
const Boom = require('boom');
const { pick } = require('lodash');

const validate = (schema = {}) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const toValidate = pick(req, Object.keys(validSchema));
  Joi.validate(toValidate, validSchema, { abortEarly: false }, (err, value) => {
    if (err) {
      return next(Boom.badRequest(`Validation Error: ${err.message}`));
    }
    Object.assign(req, value);
    return next();
  });
};

module.exports = validate;
