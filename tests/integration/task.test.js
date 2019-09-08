const { expect } = require('chai');
const request = require('supertest');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { Task } = require('../../src/models');
const {
  checkValidationError,
  checkUnauthorizedError,
  checkNotFoundError,
} = require('../utils/checkError');
const { checkTaskFormat } = require('../utils/checkResponseFormat');
const { clearDatabase } = require('../fixtures');
const { userOneAccessToken, userOne, insertUser } = require('../fixtures/user.fixture');
const { taskOne, taskFour, userOneTasks, insertAllTasks } = require('../fixtures/task.fixture');

describe('Task Route', () => {
  let accessToken;
  let taskId;
  let reqBody;
  beforeEach(async () => {
    await clearDatabase();
    await insertUser(userOne);
    await insertAllTasks();
    accessToken = userOneAccessToken;
  });

  const testMissingAccessToken = exec => {
    return it('should return a 401 error if access token is missing', async () => {
      accessToken = null;
      const response = await exec();
      checkUnauthorizedError(response);
    });
  };

  const testBodyValidation = (exec, testCases) => {
    return testCases.forEach(({ message, body }) => {
      it(`should return a 400 error if ${message}`, async () => {
        reqBody = body;
        const response = await exec();
        checkValidationError(response);
      });
    });
  };

  const testTaskNotFound = exec => {
    return it('should return a 404 error if task is not found', async () => {
      taskId = mongoose.Types.ObjectId();
      const response = await exec();
      checkNotFoundError(response);
    });
  };

  const testAccessRightsOnTask = exec => {
    return it('should return a 404 error if task belongs to another user', async () => {
      taskId = taskFour._id.toHexString();
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  };

  describe('POST /v1/tasks', () => {
    beforeEach(() => {
      reqBody = {
        description: 'New task',
        completed: true,
      };
    });

    const exec = async () => {
      return request(app)
        .post('/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reqBody);
    };

    it('should successfully create a new task and return 201 if data is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      checkTaskFormat(response.body, reqBody);

      const dbTask = await Task.findById(response.body.id);
      expect(dbTask).to.include(reqBody);
      expect(dbTask.owner).to.deep.equal(userOne._id);
    });

    it('should set completed to false if completed is missing', async () => {
      delete reqBody.completed;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.body.completed).to.be.false;

      const dbTask = await Task.findById(response.body.id);
      expect(dbTask.completed).to.be.false;
    });

    testMissingAccessToken(exec);

    const bodyValidationTestCases = [{ body: {}, message: 'description is missing' }];
    testBodyValidation(exec, bodyValidationTestCases);
  });

  describe('GET /v1/tasks', () => {
    let query;
    beforeEach(() => {
      query = {};
    });

    const exec = async () => {
      return request(app)
        .get('/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .query(query);
    };

    it('should successfully return all the tasks that belong a specific user', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.body.length).to.be.equal(userOneTasks.length);
      response.body.forEach((responseTask, index) => {
        checkTaskFormat(responseTask, userOneTasks[index]);
      });
    });

    it('should return only completed tasks if completed query param is set to true', async () => {
      query.completed = true;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      const numCompleteTasks = userOneTasks.filter(task => task.completed).length;
      expect(response.body.length).to.be.equal(numCompleteTasks);
      expect(response.body[0]).to.have.property('completed', true);
    });

    it('should return only incomplete tasks if completed query param is set to false', async () => {
      query.completed = false;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      const numIncompleteTasks = userOneTasks.filter(task => !task.completed).length;
      expect(response.body.length).to.be.equal(numIncompleteTasks);
      expect(response.body[0]).to.have.property('completed', false);
    });

    it('should sort tasks if sort query param is specified', async () => {
      query.sort = '-completed';
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      const expectedTasksSorted = [...userOneTasks].sort((a, b) => b.completed - a.completed);
      response.body.forEach((responseTask, index) => {
        expect(responseTask.id).to.be.equal(expectedTasksSorted[index]._id.toHexString());
      });
    });

    it('should limit tasks if limit query param is specified', async () => {
      query.limit = 1;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.body.length).to.be.equal(query.limit);
    });

    it('should skip tasks if skip query param is specified', async () => {
      query.skip = 1;
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.body.length).to.be.equal(userOneTasks.length - query.skip);
    });

    testMissingAccessToken(exec);
  });

  describe('GET /v1/tasks/:taskId', () => {
    beforeEach(() => {
      taskId = taskOne._id.toHexString();
    });

    const exec = async () => {
      return request(app)
        .get(`/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    };

    it('should successfully return 200 and the task if data is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      checkTaskFormat(response.body, taskOne);
    });

    testMissingAccessToken(exec);

    testTaskNotFound(exec);

    testAccessRightsOnTask(exec);
  });

  describe('PATCH /v1/tasks/:taskId', () => {
    beforeEach(() => {
      taskId = taskOne._id.toHexString();
      reqBody = {
        description: 'New task description',
        completed: false,
      };
    });

    const exec = async () => {
      return request(app)
        .patch(`/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reqBody);
    };

    it('should successfully update the task and return 200 if data is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.body).to.include(reqBody);
      expect(response.body).to.have.property('id');

      const dbTask = await Task.findById(taskOne._id);
      expect(dbTask).to.be.ok;
      expect(dbTask).to.include(reqBody);
    });

    testMissingAccessToken(exec);

    testTaskNotFound(exec);

    testAccessRightsOnTask(exec);

    const bodyValidationTestCases = [{ body: {}, message: 'no update fields are specified' }];
    testBodyValidation(exec, bodyValidationTestCases);
  });

  describe('DELETE /v1/tasks/:taskId', () => {
    beforeEach(() => {
      taskId = taskOne._id.toHexString();
    });

    const exec = async () => {
      return request(app)
        .delete(`/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    };

    it('should successfully delete the task and return 204 if data is valid', async () => {
      const response = await exec();
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbTask = await Task.findById(taskId);
      expect(dbTask).not.to.be.ok;
    });

    testMissingAccessToken(exec);

    testTaskNotFound(exec);

    testAccessRightsOnTask(exec);
  });
});
