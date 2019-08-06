const express = require('express')
const { signUp } = require('../controllers/user.controller')

const router = express.Router()

router.post('/users', signUp)

module.exports = router
