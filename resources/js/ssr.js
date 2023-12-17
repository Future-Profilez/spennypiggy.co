import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react'
import createServer from '@inertiajs/react/server'
import ReactDOMServer from 'react-dom/server'
import { Provider } from 'react-redux';
import store from './Pages/redux/Store';

const appName = import.meta.env.VITE_APP_NAME || 'Spenny Piggy';
createServer(page =>
  createInertiaApp({
    title: (title)  => {`${title} - ${appName}`},
    page,
    render: ReactDOMServer.renderToString,
    resolve: name => {
      const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
      return pages[`./Pages/${name}.jsx`]
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <Provider store={store} >
                <App {...props} />
            </Provider>
        );
    },
  }),
)
