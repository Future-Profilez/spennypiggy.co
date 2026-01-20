import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import './ssr-shims.js';
import createServer from '@inertiajs/react/server';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import store from './Pages/redux/Store';

const appName = import.meta.env.VITE_APP_NAME || 'Spenny Piggy';
const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });

// Capture the mock window from shims
const mockWindow = globalThis.window;
let hideWindowForInertia = false;

// Redefine global window to allow hiding it from Inertia's server check
try {
    Object.defineProperty(globalThis, 'window', {
        get() { return hideWindowForInertia ? undefined : mockWindow; },
        configurable: true
    });
} catch (e) {
    console.error('Failed to redefine global.window:', e);
}

createServer((page) => {
  // Hide window so createInertiaApp detects "server" environment
  hideWindowForInertia = true;
  
  const promise = createInertiaApp({
    page,
    render: renderToString,
    title: title => `${title || appName} - ${appName}`,
    resolve: name => {
      const mod = pages[`./Pages/${name}.jsx`];
      return (mod && mod.default) || (() => React.createElement('div', null, ''));
    },
    setup: ({ App, props }) => {
      return React.createElement(
        Provider,
        { store },
        React.createElement(App, props)
      );
    },
  });

  // Restore window immediately so components can use it during rendering
  hideWindowForInertia = false;

  return promise;
});
