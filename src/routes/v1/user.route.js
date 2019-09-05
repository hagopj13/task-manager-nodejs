const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { user: validation } = require('../../validations');
const { user: controller } = require('../../controllers');

const router = express.Router();

router
  .route('/:userId')
  .get(auth('getUsers'), validate(validation.getUser), controller.getUser)
  .patch(auth('manageUsers'), validate(validation.updateUser), controller.updateUser)
  .delete(auth('manageUsers'), validate(validation.deleteUser), controller.deleteUser);

module.exports = router;
