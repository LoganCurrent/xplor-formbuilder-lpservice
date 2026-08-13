const config = require('./jest.config');

module.exports = {
  ...config,
  collectCoverage: false,
  testMatch: ['**/test/integration/**/**/**/*.test.[jt]s?(x)'],
};
