const Joi = require('@hapi/joi');

const objectId = () => {
  return Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid mongo id');
};

Joi.objectId = objectId;

module.exports = Joi;
