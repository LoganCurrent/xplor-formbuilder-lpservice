module.exports = {
  preset: 'ts-jest',
  verbose: true,
  collectCoverage: true,
  silent: false,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/test/unit/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/dist'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/'
  ],
  setupFiles: ['dotenv/config'],
};
