const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const methodOverride = require('method-override');
const passport = require('passport');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
require('./db/mongoose');
const { successResponseMorgan, errorResponseMorgan } = require('./config/morgan');
const routes = require('./routes/v1');
const { errorConverter, errorHandler, notFoundError } = require('./middlewares/error');

const app = express();

app.use(successResponseMorgan);
app.use(errorResponseMorgan);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());
app.use(methodOverride());
app.use(helmet());
app.use(cors());

app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use('/v1/auth', authLimiter);
app.use('/v1', routes);

app.use(notFoundError);
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
