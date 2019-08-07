const { port } = require('./config/config');
const app = require('./app');

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening to port ${port}`);
});
