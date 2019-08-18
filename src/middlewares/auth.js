const passport = require('passport');
const Boom = require('boom');
const { promisify } = require('util');

const jwtCallback = (req, res, next) => async (err, user, info) => {
  const unauthorizedError = Boom.unauthorized('Please authenticate');
  if (err || info) {
    return next(unauthorizedError);
  }

  const login = promisify(req.login);
  try {
    await login(user, { session: false });
  } catch (e) {
    return next(unauthorizedError);
  }

  // manage access rights here

  next();
};

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, jwtCallback(req, res, next))(req, res, next);
};

module.exports = auth;
