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
import axios from "axios";
import DeviceID from "./includes/DeviceID";

// PWA Debug utilities (development only)
import "./utils/pwaDebug";

// Only initialize Sentry on the production domain
if (window.location.hostname === 'spennypiggy.co' || window.location.hostname === 'www.spennypiggy.co') {
    console.log("Sentry Enabled");
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
} 

// Global cart refresh functions setup
function setupGlobalCartFunctions(props) {
    const auth = props?.page?.props?.auth;
    const deviceid = DeviceID();
    
    console.log("Setting up global cart refresh functions, auth:", !!auth?.user);
    
    // Anonymous cart refresh function
    const fetchAnonymousCartItems = async () => {
        console.log("Global fetchAnonymousCartItems called with deviceid:", deviceid);
        try {
            const timestamp = new Date().getTime();
            const config = {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            };
            const response = await axios.get(`anonymous-cart/${deviceid}?_t=${timestamp}`, config);
            console.log("Global anonymous cart response:", response.data);
            // Dispatch event for components to listen to
            window.dispatchEvent(new CustomEvent('cartItemsRefreshed', {
                detail: { carts: response.data.carts, isAuthenticated: false }
            }));
        } catch (error) {
            console.error("Global error fetching anonymous cart:", error);
        }
    };
    
    // Authenticated cart refresh function
    const fetchAuthenticatedCartItems = async () => {
        console.log("Global fetchAuthenticatedCartItems called");
        try {
            // Include device_id for potential cart merging fallback
            const config = {
                headers: {
                    'X-Device-ID': deviceid
                }
            };
            // Add cache-busting parameter
            const timestamp = new Date().getTime();
            const response = await axios.get(`authenticated-cart?_t=${timestamp}`, config);
            console.log("Global authenticated cart response:", response.data);
            console.log("Authenticated cart items count:", response.data.carts ? response.data.carts.length : 0);
            if (response.data.success) {
                // Dispatch event for components to listen to
                window.dispatchEvent(new CustomEvent('cartItemsRefreshed', {
                    detail: { carts: response.data.carts, isAuthenticated: true }
                }));
                console.log("Dispatched cartItemsRefreshed event for authenticated user");
            } else {
                console.error("Authenticated cart API returned success=false:", response.data);
            }
        } catch (error) {
            console.error("Global error fetching authenticated cart:", error);
            console.error("Error details:", error.response?.data);
        }
    };
    
    // Rye items refresh function
    const fetchRyeItems = async () => {
        console.log("Global fetchRyeItems called");
        try {
            const response = await axios.get(`get-cart-details`);
            if (response?.data?.status) {
                // Dispatch event for components to listen to
                window.dispatchEvent(new CustomEvent('ryeItemsRefreshed', {
                    detail: { ryeItems: response.data.data }
                }));
            }
        } catch (error) {
            console.error("Global error fetching rye items:", error);
        }
    };
    
    // Cart counter refresh function 
    const fetchCartCounter = async () => {
        console.log("Global fetchCartCounter called with deviceid:", deviceid);
        try {
            const timestamp = new Date().getTime();
            const config = {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            };
            const response = await axios.get(`/counter/${deviceid}?_t=${timestamp}`, config);
            console.log("Global cart counter response:", response.data.counter);
            // Dispatch event for components to listen to
            window.dispatchEvent(new CustomEvent('cartCounterRefreshed', {
                detail: { counter: response.data.counter }
            }));
        } catch (error) {
            console.error("Global error fetching cart counter:", error);
        }
    };
    
    // Set up global refresh functions based on authentication status
    if (typeof window !== 'undefined') {
        if (auth?.user) {
            console.log("Setting up authenticated cart refresh functions");
            window.refreshCartItems = fetchAuthenticatedCartItems;
        } else {
            console.log("Setting up anonymous cart refresh functions");
            window.refreshCartItems = fetchAnonymousCartItems;
        }
        window.refreshRyeItems = fetchRyeItems;
        window.refreshCartCounter = fetchCartCounter;
        
        // Update functions when auth state changes (on Inertia navigation)
        document.addEventListener('inertia:success', (event) => {
            const newAuth = event?.detail?.page?.props?.auth;
            if (newAuth?.user) {
                console.log("Auth state changed to authenticated - updating refresh functions");
                window.refreshCartItems = fetchAuthenticatedCartItems;
            } else {
                console.log("Auth state changed to anonymous - updating refresh functions");
                window.refreshCartItems = fetchAnonymousCartItems;
            }
        });
    }
}


createInertiaApp({
    title: (title) =>
        `${title || "Spenny Piggy"} - The Everything Wishlist - Gifts, Memberships, Exclusive Content & More.`,
    resolve: (name) => {
        return resolvePageComponent(
            `./Pages/${name}.jsx`,
            // Use eager: false for better code splitting
            import.meta.glob("./Pages/**/*.jsx", { eager: false })
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <React.StrictMode>
                <Provider store={store}>
                    <Suspense fallback={<>Loading...</>}>
                        <App {...props} />
                    </Suspense>
                </Provider>
            </React.StrictMode>
        );
        
        // Hide initial loading screen once React app is mounted
        setTimeout(() => {
            document.body.classList.add('app-loaded');
            // Remove the loading screen element after transition
            setTimeout(() => {
                const loadingScreen = document.getElementById('initial-loading-screen');
                if (loadingScreen) {
                    loadingScreen.remove();
                }
            }, 500); // Wait for CSS transition to complete
        }, 100); // Small delay to ensure app is rendered
        
        // Set up global cart refresh functions
        setupGlobalCartFunctions(props);
        
        // Initialize non-critical resources after the app is mounted
        // Use setTimeout to ensure this runs after the current event loop
        // setTimeout(() => {
        //     // initializeApp().catch(console.error);
            
        //     // Initialize intelligent chunk preloading
        //     const currentPage = props?.page?.component;
        //     if (currentPage) {
        //         // chunkPreloader.preloadCriticalChunks(currentPage);
        //     }
            
        //     // Re-observe links after Inertia navigation
        //     document.addEventListener('inertia:success', () => {
        //         setTimeout(() => {
        //             chunkPreloader.observeLinks();
        //         }, 100);
        //     });
        // }, 0);
    },
    progress: {
        color: "var(--pink)",
        delay: 100,
        includeCSS: true,
        showSpinner: false,
    },
});
