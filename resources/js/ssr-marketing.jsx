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
/*
 * 🚨 EAGER. Code splitting is a BROWSER optimisation and it is actively wrong here.
 *
 * With a lazy glob every page arrives as a dynamic import, and `renderToString`
 * is synchronous — it cannot wait for one. React throws "A component suspended
 * while responding to synchronous input", the render returns an empty body, and
 * TimeoutGateway falls back to client-side rendering. Measured against a freshly
 * started server: /leaderboard failed its first TWO requests and only rendered on
 * the third, once Node had the chunk in its module cache. So after every deploy
 * the first visitors to each page silently got no SSR, and nothing looked broken.
 *
 * Eager resolves every page at startup instead: one bundle, no suspense, correct
 * from the first request. The cost is startup time and memory on the SSR host,
 * which is what that host is for — it serves nothing else.
 */
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
      // Eager glob hands back the module itself; the lazy form hands back a
      // loader. Accept both so this does not break if the glob is ever changed.
      return typeof pageFn === 'function' ? pageFn() : pageFn;
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
