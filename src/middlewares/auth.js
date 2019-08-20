const passport = require('passport');
const Boom = require('boom');

const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  const unauthorizedError = Boom.unauthorized('Please authenticate');
  if (err || info || !user) {
    return reject(unauthorizedError);
  }
  req.user = user;
  // TODO: manage access rights

  resolve();
};

const auth = () => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line
    // prettier-ignore
    passport.authenticate(
      'jwt',
      { session: false },
      verifyCallback(req, resolve, reject)
    )(req, res, next);
  })
    .then(() => next())
    .catch(err => next(err));
};

module.exports = auth;
