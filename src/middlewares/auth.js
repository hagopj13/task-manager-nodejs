const passport = require('passport');
const Boom = require('boom');

const jwtCallback = (req, res, next) => async (err, user, info) => {
  const unauthorizedError = Boom.unauthorized('Please authenticate');
  if (err || info) {
    return next(unauthorizedError);
  }
  req.user = user;
  // manage access rights here

  next();
};

const auth = () => (req, res, next) => {
  passport.authenticate('jwt', { session: false }, jwtCallback(req, res, next))(req, res, next);
};

module.exports = auth;
