const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { user: validation } = require('../../validations');
const { user: controller } = require('../../controllers');

const router = express.Router();

router
  .route('/me')
  .get(auth(), controller.getCurrentUser)
  .patch(auth(), validate(validation.updateCurrentUser), controller.updateCurrentUser)
  .delete(auth(), controller.deleteCurrentUser);

module.exports = router;
