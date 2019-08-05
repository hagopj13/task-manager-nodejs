const User = require('../models/user')
const asyncMiddleware = require('../middlewares/asyncMiddleware')

const signUp = asyncMiddleware(async (req, res) => {
  const user = new User(req.body)
  await user.save()
  res.status(201).send({ user })
}, 400)

module.exports = {
  signUp,
}
