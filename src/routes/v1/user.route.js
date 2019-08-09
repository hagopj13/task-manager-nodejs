const express = require('express');
const validate = require('../../middlewares/validate');
const controller = require('../../controllers/user.controller');
const validation = require('../../validations/user.validation');

const router = express.Router();

router.post('/users', validate(validation.register), controller.register);

module.exports = router;
