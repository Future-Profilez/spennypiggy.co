import React from 'react';
// Shim useLayoutEffect for SSR to avoid warnings
if (typeof React.useLayoutEffect !== 'undefined') {
    React.useLayoutEffect = React.useEffect;
}
import './ssr-shims.js';
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import store from './Pages/redux/Store';
import { route } from 'ziggy-js';
import { Ziggy } from './ziggy';

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

globalThis.route = (name, params, absolute) => {
  return route(name, params, absolute, Ziggy);
};

createServer(async (page) => {
  hideWindowForInertia = true;
  try {
    return await createInertiaApp({
      page,
      render: renderToString,
      title: (title) => `${title || appName} - ${appName}`,
      resolve: (name) => {
        const mod = pages[`./Pages/${name}.jsx`];
        return (mod && mod.default) || (() => React.createElement('div', null, ''));
      },
      setup: ({ App, props }) => {
        // Ensure Ziggy is available in the component tree if passed via props
        const ziggy = props.initialPage.props.ziggy;
        if (ziggy) {
            globalThis.Ziggy = ziggy;
        }
        return React.createElement(
          Provider,
          { store },
          React.createElement(App, props)
        );
      },
    });
  } catch (error) {
    console.error('SSR Error:', error);
    throw error;
  } finally {
    hideWindowForInertia = false;
  }
});
