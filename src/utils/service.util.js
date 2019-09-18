const getQueryOptions = ({ limit, skip, sort }) => {
  const options = {
    ...(limit && { limit: parseInt(limit, 10) }),
    ...(skip && { skip: parseInt(skip, 10) }),
    ...(sort && { sort }),
  };

  return options;
};

module.exports = {
  getQueryOptions,
};
