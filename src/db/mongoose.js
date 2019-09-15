const mongoose = require('mongoose');
const { mongodbUrl } = require('../config/config');

mongoose.connect(mongodbUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
