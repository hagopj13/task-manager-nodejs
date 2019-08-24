const express = require('express');
const authRoute = require('./auth.route');
const taskRoute = require('./task.route');
const userRoute = require('./user.route');

const router = express.Router();

router.use('/auth', authRoute);
router.use('/tasks', taskRoute);
router.use('/users', userRoute);

module.exports = router;
