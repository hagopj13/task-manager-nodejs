const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { userValidation } = require('../../validations');
const { userController } = require('../../controllers');

const router = express.Router();

router.route('/').get(validate(userValidation.getUsers), auth('getUsers'), userController.getUsers);

router
  .route('/:userId')
  .get(validate(userValidation.getUser), auth('getUsers'), userController.getUser)
  .patch(validate(userValidation.updateUser), auth('manageUsers'), userController.updateUser)
  .delete(validate(userValidation.deleteUser), auth('manageUsers'), userController.deleteUser);

module.exports = router;
