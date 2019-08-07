const express = require('express');
require('./db/mongoose');
const routes = require('./routes/v1');
const { errorConverter, errorHandler, notFoundError } = require('./middlewares/error');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/v1', routes);

app.use(notFoundError);
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
