const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { authValidation } = require('../../validations');
const { authController } = require('../../controllers');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refreshToken', validate(authValidation.refreshToken), authController.refreshToken);
router.post('/logoutAll', auth(), authController.logoutAll);

module.exports = router;
