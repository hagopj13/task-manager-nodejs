const express = require('express')
require('./db/mongoose')

const userRoute = require('./routes/user')
const errorHandler = require('./middlewares/errorHandler')

const app = express()
app.use(express.json())
app.use(userRoute)

app.use(errorHandler)

module.exports = app
