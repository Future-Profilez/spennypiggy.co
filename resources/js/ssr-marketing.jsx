import React from 'react';
// Shim useLayoutEffect for SSR to avoid warnings
if (typeof React.useLayoutEffect !== 'undefined') {
    React.useLayoutEffect = React.useEffect;
}
import { createInertiaApp } from '@inertiajs/react';
import './ssr-shims.js';
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

// Global route helper for SSR
globalThis.route = (name, params, absolute) => {
    return route(name, params, absolute, Ziggy);
};

export default (page) => {
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
      // Ensure Ziggy is available in props
      const ziggy = props.initialPage.props.ziggy;
      if (ziggy) {
          globalThis.Ziggy = ziggy;
      }
      
      // Hook route into the component context if needed, but globalThis.route should cover it
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
};
