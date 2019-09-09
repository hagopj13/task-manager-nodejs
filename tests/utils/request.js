const axiosist = require('axiosist');
const app = require('../../src/app');

const request = async ({ method, url, headers, params, query, body }) => {
  const config = {
    method,
    url,
    headers: headers || {},
    params: query || {},
    data: body || {},
  };

  let requestUrl = url;
  if (params) {
    Object.keys(params).forEach(param => {
      requestUrl = requestUrl.replace(`:${param}`, params[param]);
    });
  }
  config.url = requestUrl;

  return axiosist(app).request(config);
};

module.exports = request;
