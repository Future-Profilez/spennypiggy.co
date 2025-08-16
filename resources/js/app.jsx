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
<<<<<<< HEAD
import store from "./Pages/redux/Store.jsx";

// Performance components
import { LoadingSkeleton } from "./Components/OptimizedComponents";
// Temporarily disable ErrorBoundary to isolate JSX runtime issue
// import { ErrorBoundary } from "./Components/OptimizedComponents";

// Intelligent chunk preloader
import chunkPreloader from "./utils/chunkPreloader.js";

// Dynamic imports for non-critical resources
const loadNonCriticalAssets = async () => {
    // Non-critical CSS is now loaded statically at the top of the file
    // to prevent MIME type issues in production
    console.log('📦 Non-critical assets loaded');
};

// Initialize Web Vitals monitoring
const initWebVitals = async () => {
    if (typeof window === 'undefined') return;
    
    try {
        const { initWebVitalsMonitoring, detectPerformanceRegression } = await import('./monitoring/web-vitals.js');
        
        // Initialize core monitoring
        initWebVitalsMonitoring();
        
        // Enable performance regression detection
        detectPerformanceRegression();
        
        console.log('📊 Web Vitals monitoring initialized');
    } catch (error) {
        // Silently fail in production to avoid breaking the app
        if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to initialize Web Vitals monitoring:', error);
        }
    }
};

// Initialize Sentry with dynamic import for better performance
let sentryInitialized = false;
const initSentry = async () => {
    if (sentryInitialized) return;
    
    const Sentry = await import("@sentry/react");
    
=======
import store from "./Pages/redux/Store";
import * as Sentry from "@sentry/react";
if(import.meta.env.VITE_APP_ENV == 'production'){
>>>>>>> 65802cfe9cf3eb1ab0f86ad06cde649a00c91259
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
<<<<<<< HEAD
    
    sentryInitialized = true;
};

// Initialize non-critical assets and Sentry after app mount
const initializeApp = async () => {
    // Load non-critical assets in parallel
    await Promise.all([
        loadNonCriticalAssets(),
        initSentry(),
        initWebVitals() // Initialize Web Vitals monitoring
    ]);
};
=======
} else {
    console.log("sentry Disabled");
}
>>>>>>> 65802cfe9cf3eb1ab0f86ad06cde649a00c91259

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
