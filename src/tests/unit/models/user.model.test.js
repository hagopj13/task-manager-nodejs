const mongoose = require('mongoose');
const { expect } = require('chai');
const User = require('../../../models/user.model');
const { userOne } = require('../../fixtures/user.fixtures');

describe('User model unit tests', () => {
  after(() => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
  });

  describe('User validation', () => {
    let newUser;
    beforeEach(() => {
      newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Red1234!',
        age: 22,
      };
    });

    const validateUser = (isValidExpected, done) => {
      const user = new User(newUser);
      user.validate(err => {
        if (isValidExpected) {
          expect(err).to.be.null;
        } else {
          expect(err).not.to.be.null;
        }
        done();
      });
    };

    it('should correctly validate a valid user', done => {
      validateUser(true, done);
    });

    it('should throw a validation error when email is invalid', done => {
      newUser.email = 'invalidemail';
      validateUser(false, done);
    });

    it('should throw a validation error when password contains the word password', done => {
      newUser.password = 'Red1234!password';
      validateUser(false, done);
    });

    it('should throw a validation error when password is shorter than 8 characters', done => {
      newUser.password = 'Red1234';
      validateUser(false, done);
    });

    it('should throw a validation error when age is less than 0', done => {
      newUser.age = -1;
      validateUser(false, done);
    });
  });

  describe('User toJSON method', () => {
    it('should not return user password when toJSON is called', () => {
      const user = new User(userOne);
      expect(user.toJSON()).not.to.have.property('password');
    });
  });
});
