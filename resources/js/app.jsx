// Critical CSS imports - loaded synchronously
import "../css/theme.css";
import "../css/app.css";
import "../css/core-web-vitals.css";

// React core imports
import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";

// Critical app dependencies - loaded immediately
import { Provider } from "react-redux";
import store from "./Pages/redux/Store";

// Performance components
import { ErrorBoundary, LoadingSkeleton } from "./Components/OptimizedComponents";

// Intelligent chunk preloader
import chunkPreloader from "./utils/chunkPreloader.js";

// Dynamic imports for non-critical resources
const loadNonCriticalAssets = async () => {
    // Load Bootstrap CSS and additional styles asynchronously
    await Promise.all([
        import("bootstrap/dist/css/bootstrap.min.css"),
        import("../css/index.css"),
        import("../css/home.css"),
        // Font preloading handled via CSS
    ]);
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
        console.warn('Failed to initialize Web Vitals monitoring:', error);
    }
};

// Initialize Sentry with dynamic import for better performance
let sentryInitialized = false;
const initSentry = async () => {
    if (sentryInitialized) return;
    
    const Sentry = await import("@sentry/react");
    
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
            <ErrorBoundary>
                <Provider store={store}>
                    <Suspense fallback={<LoadingSkeleton rows={3} />}>
                        <App {...props} />
                    </Suspense>
                </Provider>
            </ErrorBoundary>
        );
        
        // Initialize non-critical resources after the app is mounted
        // Use setTimeout to ensure this runs after the current event loop
        setTimeout(() => {
            initializeApp().catch(console.error);
            
            // Initialize intelligent chunk preloading
            const currentPage = props.page.component;
            chunkPreloader.preloadCriticalChunks(currentPage);
            
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
