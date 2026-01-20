import React from 'react';
import createServer from '@inertiajs/react/server';
import { createInertiaApp } from '@inertiajs/react';
import { renderToString } from 'react-dom/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Provider } from 'react-redux';
import store from './Pages/redux/Store';

const appName = import.meta.env.VITE_APP_NAME || 'Spenny Piggy';

createServer(async ({ render, page }) => {
  await render(page, {
    title: (title) => `${title || appName} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx', { eager: true })),
    setup: ({ App, props }) => (
      <Provider store={store}>
        <App {...props} />
      </Provider>
    ),
    render: renderToString,
  });
});
