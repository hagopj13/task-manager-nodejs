const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { auth: validation } = require('../../validations');
const { auth: controller } = require('../../controllers');

const router = express.Router();

router.post('/register', validate(validation.register), controller.register);
router.post('/login', validate(validation.login), controller.login);
router.post('/refreshToken', validate(validation.refreshToken), controller.refreshToken);
router.post('/logoutAll', auth(), controller.logoutAll);

module.exports = router;
