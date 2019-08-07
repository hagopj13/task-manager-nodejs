const mongoose = require('mongoose');

mongoose.connect(process.env.MONDODB_URL, {
  useCreateIndex: true,
  useNewUrlParser: true,
});
