const express = require('express');
const validate = require('../../middlewares/validate');
const controller = require('../../controllers/auth.controller');
const validation = require('../../validations/auth.validation');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/register', validate(validation.register), controller.register);
router.post('/login', validate(validation.login), controller.login);
router.post('/refreshToken', validate(validation.refreshToken), controller.refreshToken);
router.post('/logoutAll', auth(), controller.logoutAll);

module.exports = router;
