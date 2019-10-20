const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');
const methodOverride = require('method-override');
const passport = require('passport');
const { env } = require('./config/config');
const { connectDb } = require('./config/mongoose');
const { jwtStrategy } = require('./config/passport');
const { successResponseMorgan, errorResponseMorgan } = require('./config/morgan');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler, notFoundError } = require('./middlewares/error');

connectDb();

const app = express();

if (env !== 'test') {
  app.use(successResponseMorgan);
  app.use(errorResponseMorgan);
}

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

app.use(compression());
app.use(methodOverride());
app.use(cors());
app.options('*', cors());

app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

if (env === 'production') {
  app.use('/v1/auth', authLimiter);
}
app.use('/v1', routes);

app.use(notFoundError);
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
