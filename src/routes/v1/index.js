const express = require('express')
const userRoute = require('./user.route')

const router = express.Router()

router.use(userRoute)

module.exports = router
