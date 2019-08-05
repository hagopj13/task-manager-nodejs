const express = require('express')
require('./db/mongoose')

const app = express()
app.use(express.json())
app.use('/', (req, res) => {
  res.send('Working')
})

module.exports = app
