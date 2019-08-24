const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const validation = require('../../validations/task.validation');
const controller = require('../../controllers/task.controller');

const router = express.Router();

router.route('/').post(auth(), validate(validation.createTask), controller.createTask);

module.exports = router;
