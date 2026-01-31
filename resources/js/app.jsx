import React, { Children } from "./react-polyfill.js";
import { route } from 'ziggy-js';
import "./bootstrap";

// Make route function available globally
window.route = route;

import "bootstrap/dist/css/bootstrap.min.css";
import "../css/theme.css";
import "../css/app.css";
import "../css/core-web-vitals.css";
import "../css/index.css";
import "../css/home.css";

import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { router } from "@inertiajs/react";

import { Provider } from "react-redux";
import store from "./Pages/redux/Store";
import * as Sentry from "@sentry/react";
import axios from "axios";
import DeviceID from "./includes/DeviceID";
import "./utils/pwaDebug";
import Maintaince from "./Components/Maintaince.jsx";

if (window.location.hostname === 'spennypiggy.co' || window.location.hostname === 'www.spennypiggy.co' || window.location.hostname === 'https://www.spennypiggy.co') {
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
function setupGlobalCartFunctions(props) {
    const auth = props?.page?.props?.auth;
    const deviceid = DeviceID();
    
    
    // Anonymous cart refresh function
    const fetchAnonymousCartItems = async () => {
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
            if (response.data.success) {
                // Dispatch event for components to listen to
                window.dispatchEvent(new CustomEvent('cartItemsRefreshed', {
                    detail: { carts: response.data.carts, isAuthenticated: true }
                }));
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
            window.refreshCartItems = fetchAuthenticatedCartItems;
        } else {
            window.refreshCartItems = fetchAnonymousCartItems;
        }
        window.refreshRyeItems = fetchRyeItems;
        window.refreshCartCounter = fetchCartCounter;
        
        // Update functions when auth state changes (on Inertia navigation)
        document.addEventListener('inertia:success', (event) => {
            const newAuth = event?.detail?.page?.props?.auth;
            if (newAuth?.user) {
                window.refreshCartItems = fetchAuthenticatedCartItems;
            } else {
                window.refreshCartItems = fetchAnonymousCartItems;
            }
        });
    }
}

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: "" };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorMessage: error && error.message ? error.message : ""
        };
    }

    componentDidCatch(error) {
        try {
            Sentry.captureException(error);
        } catch (e) {
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <Maintaince />
            );
        }

        return this.props.children;
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
                    <Suspense fallback={null}>
                        <GlobalErrorBoundary>
                            <App {...props} />
                        </GlobalErrorBoundary>
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
    },
    progress: {
        color: "var(--pink)",
        delay: 100,
        includeCSS: true,
        showSpinner: false,
    },
});

// Configure Inertia.js to include CSRF token in all requests
router.on('before', (event) => {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        event.detail.visit.headers = {
            ...event.detail.visit.headers,
            'X-CSRF-TOKEN': token.content
        };
    }
});
