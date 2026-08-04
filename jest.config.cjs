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
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/resources/js/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  /*
   * Babel options are declared INLINE with `configFile: false` on purpose.
   *
   * A root babel.config.js would also be picked up by @vitejs/plugin-react and
   * would change what the production bundle compiles to — a test-only concern
   * must not reach the build. Scoping it here keeps Vite on its own pipeline.
   */
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', {
      babelrc: false,
      configFile: false,
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
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
