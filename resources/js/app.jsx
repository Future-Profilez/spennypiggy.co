// import './bootstrap';
import '../css/theme.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/app.css';
import '../css/index.css';
import '../css/home.css';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';


// FONTS IMPORT FROM FILES
import '../assets/fonts/newfont.woff';
import '../assets/fonts/newfont.woff2';

import '../assets/fonts/CeraGRMedium.woff';
import '../assets/fonts/CeraGRMedium.woff2';


const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<>
            <App {...props} />
        </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
