module.exports = [
  {
    method: 'POST',
    path: '/login',
    handler: 'auth.login',
    config: {
      auth: false
    },
  },
];
