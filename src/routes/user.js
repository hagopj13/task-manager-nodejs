const express = require('express')
const { signUp } = require('../controllers/user')

const router = express.Router()

router.post('/users', signUp)

module.exports = router
