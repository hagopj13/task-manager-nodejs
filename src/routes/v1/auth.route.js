const express = require('express');
const validate = require('../../middlewares/validate');
const controller = require('../../controllers/auth.controller');
const validation = require('../../validations/auth.validation');

const router = express.Router();

router.post('/register', validate(validation.register), controller.register);

module.exports = router;