const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const methodOverride = require('method-override');
require('./db/mongoose');
const { morganFormat } = require('./config/config');
const logger = require('./config/logger');
const routes = require('./routes/v1');
const { errorConverter, errorHandler, notFoundError, errorLogger } = require('./middlewares/error');

const app = express();

app.use(morgan(morganFormat, { stream: logger.stream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());
app.use(methodOverride());
app.use(helmet());
app.use(cors());

app.use('/v1', routes);

app.use(notFoundError);
app.use(errorConverter);
app.use(errorHandler);
app.use(errorLogger);

module.exports = app;
