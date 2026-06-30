/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@foco/(.*)$': '<rootDir>/../foco/src/$1',
  },
};
