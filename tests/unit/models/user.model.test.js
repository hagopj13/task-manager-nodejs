const { expect } = require('chai');
const { User } = require('../../../src/models');
const { userOne } = require('../../fixtures/user.fixture');

describe('User model unit tests', () => {
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

    const testValidUser = done => {
      const user = new User(newUser);
      user.validate(err => {
        expect(err).to.be.null;
        done();
      });
    };

    it('should correctly validate a valid user', done => {
      testValidUser(done);
    });

    const testInvalidUser = done => {
      const user = new User(newUser);
      user.validate(err => {
        expect(err).not.to.be.null;
        done();
      });
    };

    it('should throw a validation error when email is invalid', done => {
      newUser.email = 'invalidemail';
      testInvalidUser(done);
    });

    it('should throw a validation error when password contains the word password', done => {
      newUser.password = 'Red1234!password';
      testInvalidUser(done);
    });

    it('should throw a validation error when password is shorter than 8 characters', done => {
      newUser.password = 'Red1234';
      testInvalidUser(done);
    });

    it('should throw a validation error when age is less than 0', done => {
      newUser.age = -1;
      testInvalidUser(done);
    });

    it('should throw a validation error if role is not user or admin', done => {
      newUser.role = 'invalidRole';
      testInvalidUser(done);
    });
  });

  describe('User toJSON method', () => {
    it('should not return user password when toJSON is called', () => {
      const user = new User(userOne);
      expect(user.toJSON()).not.to.have.property('password');
    });
  });
});
