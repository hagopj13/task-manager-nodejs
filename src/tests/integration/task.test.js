const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app');
const Task = require('../../models/task.model');
const { checkValidationError, checkUnauthorizedError } = require('../../utils/test.util');
const { resetDatabase } = require('../fixtures');
const { userOneAccessToken, userOne } = require('../fixtures/user.fixture');

describe.only('Task Route', () => {
  let accessToken;
  beforeEach(async () => {
    await resetDatabase();
    accessToken = userOneAccessToken;
  });

  describe('POST /v1/tasks', () => {
    let newTask;
    beforeEach(() => {
      newTask = {
        description: 'New task',
        completed: true,
      };
    });

    const exec = async () => {
      return request(app)
        .post('/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newTask);
    };

    it('should successfully create a new task if input data are correct', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body).to.include(newTask);
      expect(response.body).to.have.property('id');

      const dbTask = await Task.findById(response.body.id);
      expect(dbTask).to.be.ok;
      expect(dbTask).to.include(newTask);
      expect(dbTask.owner).to.deep.equal(userOne._id);
    });

    it('should set completed to false if completed is missing', async () => {
      delete newTask.completed;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body.completed).to.be.false;

      const dbTask = await Task.findById(response.body.id);
      expect(dbTask.completed).to.be.false;
    });

    it('should return an error if access token is missing', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });

    it('should return an error if description is missing', async () => {
      delete newTask.description;
      const response = await exec();
      checkValidationError(response);
    });
  });
});
