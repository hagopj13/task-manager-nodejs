const Joi = require('@hapi/joi');
const httpStatus = require('http-status');
const { pick } = require('lodash');
const { AppError } = require('../utils/error.util');

const validate = schema => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const toValidate = pick(req, Object.keys(validSchema));
  Joi.validate(toValidate, validSchema, { abortEarly: false }, (err, value) => {
    if (err) {
      const errorMessage = err.details.map(details => details.message).join(', ');
      return next(new AppError(httpStatus.BAD_REQUEST, errorMessage));
    }
    Object.assign(req, value);
    return next();
  });
};

module.exports = validate;
