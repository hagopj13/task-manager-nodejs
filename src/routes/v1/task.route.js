const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { taskValidation } = require('../../validations');
const { taskController } = require('../../controllers');

const router = express.Router();

router
  .route('/')
  .post(validate(taskValidation.createTask), auth(), taskController.createTask)
  .get(validate(taskValidation.getTasks), auth(), taskController.getTasks);

router
  .route('/:taskId')
  .get(validate(taskValidation.getTask), auth(), taskController.getTask)
  .patch(validate(taskValidation.updateTask), auth(), taskController.updateTask)
  .delete(validate(taskValidation.deleteTask), auth(), taskController.deleteTask);

module.exports = router;
