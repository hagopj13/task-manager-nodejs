const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../app');
const Task = require('../../models/task.model');
const { resetDatabase } = require('../fixtures');
const { userOneAccessToken } = require('../fixtures/user.fixture');

describe('Task Route', () => {
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
        completed: false,
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
    });
  });
});
