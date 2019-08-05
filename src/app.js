const express = require('express')
require('./db/mongoose')

const userRoute = require('./routes/user')

const app = express()
app.use(express.json())
app.use(userRoute)

module.exports = app
