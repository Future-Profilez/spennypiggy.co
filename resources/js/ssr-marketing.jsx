import React from 'react';
import './ssr-shims.js'; // Import shims first to ensure globals are set
// Shim useLayoutEffect for SSR to avoid warnings
if (typeof React.useLayoutEffect !== 'undefined') {
    React.useLayoutEffect = React.useEffect;
}
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/server';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import store from './Pages/redux/Store';
import { route } from 'ziggy-js';
import { Ziggy } from './ziggy';

const appName = import.meta.env.VITE_APP_NAME || 'Spenny Piggy';
// Use lazy loading (no eager: true) to allow code splitting and match user guide
const pages = import.meta.glob('./Pages/**/*.jsx');

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
    const ziggyConfig = globalThis.Ziggy || Ziggy;
    try {
        return route(name, params, absolute, ziggyConfig);
    } catch (e) {
        const fallback = name === 'home' ? '/' : `/${name}`;
        return fallback;
    }
};

createServer((page) => {
  // console.log('[SSR] Rendering page:', page.component);
  // console.log('[SSR] Props keys:', Object.keys(page.props));
  
  hideWindowForInertia = true;
  return createInertiaApp({
    page,
    render: renderToString,
    title: (title) => `${title || appName} - ${appName}`,
    resolve: (name) => {
      let pageFn = pages[`./Pages/${name}.jsx`];
      if (!pageFn) {
         console.error(`[SSR] Page not found: ${name}`);
         // Try case-insensitive matching if not found
         const expectedPath = `./Pages/${name}.jsx`.toLowerCase();
         const match = Object.keys(pages).find(key => key.toLowerCase() === expectedPath);
         if (match) {
             console.log(`[SSR] Found case-insensitive match: ${match} for ${name}`);
             pageFn = pages[match];
         }
      }

      if (!pageFn) {
         return () => React.createElement('div', null, `Page not found: ${name}`);
      }
      return pageFn();
    },
    setup: ({ App, props }) => {
      const ziggy = props.initialPage.props.ziggy;
      if (ziggy) {
          globalThis.Ziggy = ziggy;
          // console.log(`[SSR] Injected Ziggy from props. URL: ${ziggy.url}, Routes: ${Object.keys(ziggy.routes).length}`);
      } else {
          // The bundled snapshot, not nothing. Components that import `route`
          // straight from ziggy-js read globalThis.Ziggy, so leaving this unset
          // makes route() throw and blanks the whole render — HTTP 200 with an
          // empty body, which Laravel then silently falls back to CSR on.
          globalThis.Ziggy = Ziggy;
          console.warn('[SSR] Ziggy prop missing! Using bundled snapshot.');
      }
      return React.createElement(
        Provider,
        { store },
        React.createElement(App, props)
      );
    },
  }).finally(() => {
      hideWindowForInertia = false;
  });
});
