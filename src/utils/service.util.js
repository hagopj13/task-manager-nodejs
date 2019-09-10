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
  const options = {
    ...(limit && { limit: parseInt(limit, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
    ...(sort && { sort }),
  };

  return options;
};

module.exports = {
  getQueryFilter,
  getQueryOptions,
};
