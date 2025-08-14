// Critical CSS imports - loaded synchronously
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/theme.css";
import "../css/app.css";
import "../css/core-web-vitals.css";
import "../css/index.css";
import "../css/home.css";

// React core imports - ensure React is available globally to prevent Children undefined errors
import React, { Suspense, lazy, Children } from "react";
import { createRoot } from "react-dom/client";

// IMMEDIATE React.Children fix - run at module load time
// This must happen before any other React code executes
const fixReactChildren = () => {
    console.log('🔧 Applying React.Children fix...');
    
    // Fix React.Children on the main React object
    if (typeof React === 'object' && React) {
        if (!React.Children) {
            React.Children = Children;
            console.log('✅ Fixed React.Children on main React object');
        }
    }
    
    // Make React globally available for components that expect it
    if (typeof window !== 'undefined') {
        // Ensure React is globally available with proper Children
        window.React = React;
        
        // Double-check and fix React.Children on window.React
        if (window.React && !window.React.Children) {
            window.React.Children = Children;
            console.log('✅ Fixed React.Children on window.React');
        }
        
        // Use Object.defineProperty to ensure it's non-configurable
        if (window.React && Children) {
            try {
                Object.defineProperty(window.React, 'Children', {
                    value: Children,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });
            } catch (e) {
                // Property might already exist, that's okay
            }
        }
    }
    
    // Also check global scope
    if (typeof global !== 'undefined' && global) {
        try {
            if (!global.React) {
                global.React = React;
            }
            if (global.React && !global.React.Children) {
                global.React.Children = Children;
            }
        } catch (e) {
            // Might not have access to global, that's okay
        }
    }
    
    console.log('🔧 React.Children fix applied:', {
        'React.Children': !!React.Children,
        'window.React.Children': !!(typeof window !== 'undefined' && window.React && window.React.Children)
    });
};

// Apply the fix immediately
fixReactChildren();
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";

// Critical app dependencies - loaded immediately
import { Provider } from "react-redux";
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
