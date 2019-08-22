const express = require('express');
const controller = require('../../controllers/user.controller');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const validation = require('../../validations/user.validation');

const router = express.Router();

router
  .route('/me')
  .get(auth(), controller.getCurrentUser)
  .patch(auth(), validate(validation.updateCurrentUser), controller.updateCurrentUser)
  .delete(auth(), controller.deleteCurrentUser);

module.exports = router;
