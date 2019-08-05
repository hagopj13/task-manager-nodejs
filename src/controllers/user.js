/* eslint-disable no-unused-vars */
const User = require('../models/user')

const signUp = async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    res.status(201).send({ user })
  } catch (e) {
    res.status(401).send(e)
  }
}

module.exports = {
  signUp,
}
