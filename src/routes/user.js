const express = require('express')
const userCtrl = require('../controllers/user')

const router = express.Router()

router.post('/users', userCtrl.signUp)

module.exports = router
