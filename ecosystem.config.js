module.exports = {
  apps: [
    {
      name: 'app',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
    },
  ],
};
