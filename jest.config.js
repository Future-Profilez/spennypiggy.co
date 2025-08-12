module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/javascript/setupTests.js'],
  testMatch: [
    '<rootDir>/tests/javascript/**/*.test.{js,jsx}',
    '<rootDir>/tests/javascript/**/*.spec.{js,jsx}'
  ],
  collectCoverageFrom: [
    'resources/js/**/*.{js,jsx}',
    '!resources/js/**/*.d.ts',
    '!resources/js/**/index.js',
    '!**/node_modules/**'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/resources/js/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/vendor/'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
