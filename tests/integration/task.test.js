const { expect } = require('chai');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const request = require('../utils/request');
const { Task } = require('../../src/models');
const { checkNotFoundError } = require('../utils/checkError');
const { checkResponseTask } = require('../utils/checkResponse');
const { testMissingAccessToken, testBodyValidation } = require('../utils/commonTests');
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
  });

  const testTaskNotFound = getReqConfig => {
    return it('should return a 404 error if task is not found', async () => {
      taskId = mongoose.Types.ObjectId();
      const response = await request(getReqConfig());
      checkNotFoundError(response);
    });
  };

  const testAccessRightsOnTask = getReqConfig => {
    return it('should return a 404 error if task belongs to another user', async () => {
      taskId = taskFour._id.toHexString();
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.NOT_FOUND);
    });
  };

  describe('POST /v1/tasks', () => {
    beforeEach(() => {
      accessToken = userOneAccessToken;
      reqBody = {
        description: 'New task',
        completed: true,
      };
    });

    const getReqConfig = () => {
      return {
        method: 'POST',
        url: '/v1/tasks',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: reqBody,
      };
    };

    it('should successfully create a new task and return 201 if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.data).to.include(reqBody);

      const dbTask = await Task.findById(response.data.id);
      expect(dbTask).to.include(reqBody);
      expect(dbTask.owner).to.deep.equal(userOne._id);
      checkResponseTask(response.data, dbTask);
    });

    it('should set completed to false if completed is missing', async () => {
      delete reqBody.completed;
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.CREATED);
      expect(response.data.completed).to.be.false;

      const dbTask = await Task.findById(response.data.id);
      expect(dbTask.completed).to.be.false;
    });

    testMissingAccessToken(getReqConfig);

    const bodyValidationTestCases = [{ body: {}, message: 'description is missing' }];
    testBodyValidation(getReqConfig, bodyValidationTestCases);
  });

  describe('GET /v1/tasks', () => {
    let query;
    beforeEach(() => {
      accessToken = userOneAccessToken;
      query = {};
    });

    const getReqConfig = () => {
      return {
        method: 'GET',
        url: '/v1/tasks',
        headers: { Authorization: `Bearer ${accessToken}` },
        query,
      };
    };

    it('should successfully return all the tasks that belong a specific user', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.data).to.be.an('array');
      expect(response.data).to.have.lengthOf(userOneTasks.length);
      for (const [index, responseTask] of response.data.entries()) {
        const dbTask = await Task.findById(userOneTasks[index]);
        checkResponseTask(responseTask, dbTask);
      }
    });

    it('should return only completed tasks if completed query param is set to true', async () => {
      query.completed = true;
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      const numCompleteTasks = userOneTasks.filter(task => task.completed).length;
      expect(response.data.length).to.be.equal(numCompleteTasks);
      expect(response.data[0]).to.have.property('completed', true);
    });

    it('should return only incomplete tasks if completed query param is set to false', async () => {
      query.completed = false;
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      const numIncompleteTasks = userOneTasks.filter(task => !task.completed).length;
      expect(response.data.length).to.be.equal(numIncompleteTasks);
      expect(response.data[0]).to.have.property('completed', false);
    });

    it('should sort tasks if sort query param is specified', async () => {
      query.sort = '-completed';
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      const expectedTasksSorted = [...userOneTasks].sort((a, b) => b.completed - a.completed);
      response.data.forEach((responseTask, index) => {
        expect(responseTask.id).to.be.equal(expectedTasksSorted[index]._id.toHexString());
      });
    });

    it('should limit tasks if limit query param is specified', async () => {
      query.limit = 1;
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.data.length).to.be.equal(query.limit);
    });

    it('should skip tasks if skip query param is specified', async () => {
      query.skip = 1;
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.data.length).to.be.equal(userOneTasks.length - query.skip);
    });

    testMissingAccessToken(getReqConfig);
  });

  describe('GET /v1/tasks/:taskId', () => {
    beforeEach(() => {
      taskId = taskOne._id.toHexString();
      accessToken = userOneAccessToken;
    });

    const getReqConfig = () => {
      return {
        method: 'GET',
        url: '/v1/tasks/:taskId',
        params: { taskId },
        headers: { Authorization: `Bearer ${accessToken}` },
      };
    };

    it('should successfully return 200 and the task if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);

      const dbTask = await Task.findById(taskId);
      checkResponseTask(response.data, dbTask);
    });

    testMissingAccessToken(getReqConfig);

    testTaskNotFound(getReqConfig);

    testAccessRightsOnTask(getReqConfig);
  });

  describe('PATCH /v1/tasks/:taskId', () => {
    beforeEach(() => {
      taskId = taskOne._id.toHexString();
      accessToken = userOneAccessToken;
      reqBody = {
        description: 'New task description',
        completed: false,
      };
    });

    const getReqConfig = () => {
      return {
        method: 'PATCH',
        url: '/v1/tasks/:taskId',
        params: { taskId },
        headers: { Authorization: `Bearer ${accessToken}` },
        body: reqBody,
      };
    };

    it('should successfully update the task and return 200 if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.OK);
      expect(response.data).to.include(reqBody);

      const dbTask = await Task.findById(taskOne._id);
      expect(dbTask).to.include(reqBody);
      checkResponseTask(response.data, dbTask);
    });

    testMissingAccessToken(getReqConfig);

    testTaskNotFound(getReqConfig);

    testAccessRightsOnTask(getReqConfig);

    const bodyValidationTestCases = [{ body: {}, message: 'no update fields are specified' }];
    testBodyValidation(getReqConfig, bodyValidationTestCases);
  });

  describe('DELETE /v1/tasks/:taskId', () => {
    beforeEach(() => {
      taskId = taskOne._id.toHexString();
      accessToken = userOneAccessToken;
    });

    const getReqConfig = () => {
      return {
        method: 'DELETE',
        url: '/v1/tasks/:taskId',
        params: { taskId },
        headers: { Authorization: `Bearer ${accessToken}` },
      };
    };

    it('should successfully delete the task and return 204 if data is valid', async () => {
      const response = await request(getReqConfig());
      expect(response.status).to.be.equal(httpStatus.NO_CONTENT);

      const dbTask = await Task.findById(taskId);
      expect(dbTask).not.to.be.ok;
    });

    testMissingAccessToken(getReqConfig);

    testTaskNotFound(getReqConfig);

    testAccessRightsOnTask(getReqConfig);
  });
});
