import '@testing-library/jest-dom';

// Mock axios for API calls
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}));

// Mock Inertia.js
global.route = jest.fn((name, params) => `/mocked-route/${name}${params ? '?params' : ''}`);

// Mock window.location
delete window.location;
window.location = { 
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
};

// Suppress console warnings in tests unless explicitly needed
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (!args[0]?.includes('Warning:') || process.env.VERBOSE_TESTS) {
      originalWarn(...args);
    }
  };
});

afterAll(() => {
  console.warn = originalWarn;
});
