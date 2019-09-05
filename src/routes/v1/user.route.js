const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { user: validation } = require('../../validations');
const { user: controller } = require('../../controllers');

const router = express.Router();

router
  .route('/:userId')
  .get(auth(), validate(validation.getUser), controller.getUser)
  .patch(auth(), validate(validation.updateUser), controller.updateUser)
  .delete(auth(), controller.deleteCurrentUser);

module.exports = router;
