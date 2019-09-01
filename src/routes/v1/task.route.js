const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { task: validation } = require('../../validations');
const { task: controller } = require('../../controllers');

const router = express.Router();

router.route('/').post(auth(), validate(validation.createTask), controller.createTask);

router
  .route('/:taskId')
  .get(auth(), validate(validation.getTask), controller.getTask)
  .patch(auth(), validate(validation.updateTask), controller.updateTask)
  .delete(auth(), validate(validation.deleteTask), controller.deleteTask);

module.exports = router;
