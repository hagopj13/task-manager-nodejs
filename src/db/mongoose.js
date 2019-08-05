const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/task-manager-api-2', {
  useCreateIndex: true,
  useNewUrlParser: true,
})
