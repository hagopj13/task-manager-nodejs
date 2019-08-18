const express = require('express');
const controller = require('../../controllers/user.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.get('/me', auth(), controller.currentUser);

module.exports = router;
