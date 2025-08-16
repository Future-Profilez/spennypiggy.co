// CRITICAL: React polyfill MUST be imported first to prevent Children undefined errors
import React, { Children } from "./react-polyfill.js";

// Critical CSS imports - loaded synchronously
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/theme.css";
import "../css/app.css";
import "../css/core-web-vitals.css";
import "../css/index.css";
import "../css/home.css";

// React DOM imports after polyfill
import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// React Children polyfill has been applied in react-polyfill.js
console.log('📦 App.jsx loaded - React polyfill should be active');
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";

// Critical app dependencies - loaded immediately
import { Provider } from "react-redux";
import store from "./Pages/redux/Store";
import * as Sentry from "@sentry/react";
if(import.meta.env.VITE_APP_ENV == 'production'){
    console.log("sentry enabled");
    Sentry.init({
        dsn: "https://14cda094324469c174a7e04a2298502d@o4509650305679360.ingest.us.sentry.io/4509650314526720",
        sendDefaultPii: true,
        integrations: [
            Sentry.replayIntegration({
                networkDetailAllowUrls: [window.location.origin],
                networkRequestHeaders: ["Cache-Control"],
                networkResponseHeaders: ["Referrer-Policy"],
            }),
            Sentry.feedbackIntegration({
                colorScheme: "system",
                autoInject: false,
            }),
        ],
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0
    });
} else {
    console.log("sentry Disabled");
}

createInertiaApp({
    title: (title) =>
        `${title || "Spenny Piggy"} - The Everything Wishlist - Gifts, Memberships, Exclusive Content & More.`,
    resolve: (name) => {
        // Implement route-level code splitting with lazy loading
        return resolvePageComponent(
            `./Pages/${name}.jsx`,
            // Use eager: false for better code splitting
            import.meta.glob("./Pages/**/*.jsx", { eager: false })
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <Provider store={store}>
                <Suspense fallback={<LoadingSkeleton rows={3} />}>
                    <App {...props} />
                </Suspense>
            </Provider>
        );
        
        // Initialize non-critical resources after the app is mounted
        // Use setTimeout to ensure this runs after the current event loop
        setTimeout(() => {
            initializeApp().catch(console.error);
            
            // Initialize intelligent chunk preloading
            const currentPage = props?.page?.component;
            if (currentPage) {
                chunkPreloader.preloadCriticalChunks(currentPage);
            }
            
            // Re-observe links after Inertia navigation
            document.addEventListener('inertia:success', () => {
                setTimeout(() => {
                    chunkPreloader.observeLinks();
                }, 100);
            });
        }, 0);
    },
    progress: {
        color: "var(--pink)",
        delay: 100,
        includeCSS: true,
        showSpinner: false,
    },
});
