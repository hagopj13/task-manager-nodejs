const express = require('express');
require('./db/mongoose');
const routes = require('./routes/v1');
const { errorHandler } = require('./middlewares/error');

const app = express();

app.use(express.json());

app.use('/v1', routes);

app.use(errorHandler);

module.exports = app;
