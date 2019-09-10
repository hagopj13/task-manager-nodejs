const getQueryFilter = (query, params) => {
  const queryFilter = {};
  params.forEach(param => {
    if (typeof query[param] !== 'undefined') {
      queryFilter[param] = query[param];
    }
  });
  return queryFilter;
};

const getQueryOptions = ({ limit, skip, sort }) => {
  const options = {};
  if (limit) {
    options.limit = parseInt(limit, 10);
  }

  if (skip) {
    options.skip = parseInt(skip, 10);
  }

  if (sort) {
    options.sort = sort;
  }

  return options;
};

module.exports = {
  getQueryFilter,
  getQueryOptions,
};
