import React, { Children } from "./react-polyfill.js";
import { route } from 'ziggy-js';
import "./bootstrap";

window.route = route;

import "../css/fonts-optimized.css";
import "../css/theme.css";
import "../css/core-web-vitals.css";
import "../css/index.css";
import "../css/home.css";
import "../css/app.css";
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { router } from "@inertiajs/react";

import * as Sentry from "@sentry/react";
import axios from "axios";
import DeviceID from "./includes/DeviceID";
import "./utils/pwaDebug";
import Maintaince from "./Components/Maintaince.jsx";
import SmoothScroll from "./Components/SmoothScroll.jsx";
import OnboardingOverlay from "./Components/Onboarding/OnboardingOverlay.jsx";
import { initGlobalHaptics } from "./utils/hapticsGlobal";
import { initAppBadge } from "./utils/appBadge";

if (window.location.hostname === 'spennypiggy.co' || window.location.hostname === 'www.spennypiggy.co') {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN_PUBLIC,
        sendDefaultPii: false,
        ignoreErrors: [
            "NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.",
            "NotAllowedError: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD",
            "MagicBellError: Load failed",
            "AxiosError: Network Error",
            "AbortError: Abort due to cancellation of share.",
            "NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
            "TypeError: Load failed",
            "TypeError: null is not an object (evaluating 'i.cdnUrl')",
            "Error: Response not ok: 403",
            "Error: Error invoking enableDidUserTypeOnKeyboardLogging: Java object is gone",
            "TypeError: Importing a module script failed.",
            "SyntaxError: The string did not match the expected pattern.",
        ],
        beforeSend(event) {
            const value = event?.exception?.values?.[0]?.value || "";
            const type = event?.exception?.values?.[0]?.type || "";
            if (
                type === "NotAllowedError" ||
                type === "MagicBellError" ||
                type === "AbortError" ||
                type === "AxiosError" ||
                (type === "TypeError" && /load failed|cdnUrl|Importing a module script failed/i.test(value)) ||
                /permission denied|request is not allowed by the user agent|play\(\) failed because the user didn't interact|load failed|network error|response not ok:\s*403|insertBefore.*not a child of this node|abort due to cancellation of share|enableDidUserTypeOnKeyboardLogging|Java object is gone|The string did not match the expected pattern/i.test(value)
            ) {
                return null;
            }
            return event;
        },
        // Session Replay removed to cut bundle weight — error tracking, stack
        // traces, breadcrumbs and performance tracing are all unaffected.
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.feedbackIntegration({
                colorScheme: "system",
                autoInject: false,
            }),
        ],
        // Performance Monitoring
        tracesSampleRate: 0.1,
    });
    console.warn("Sentry Initialized on spennypiggy.co");
} 
function setupGlobalCartFunctions(props) {
    const auth = props?.page?.props?.auth;
    const deviceid = DeviceID();

    if (typeof document !== 'undefined' && deviceid) {
        document.cookie = `device_id=${encodeURIComponent(deviceid)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
    
    
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


// A deploy replaces every hashed asset, so a tab open across one asks the CDN for
// a chunk that no longer exists and Vite throws "Unable to preload CSS for ...".
// The page is simply stale — reload it to pick up the new manifest.
//
// The guard is a TIMESTAMP, not a one-shot flag. An earlier version cleared its
// flag on Inertia's `navigate` event, which also fires on the initial page load —
// so a reload immediately re-armed itself and an asset that was genuinely gone
// (purged CDN, bad deploy) would reload the page forever. A cooldown cannot loop:
// a second failure inside the window is left alone, and a failure long afterwards
// is a new stale-deploy event that deserves its own reload.
const PRELOAD_RELOAD_KEY = 'spenny_preload_reloaded_at';
const PRELOAD_RELOAD_COOLDOWN_MS = 60_000;

// preventDefault() is called ONLY on the path that actually reloads. Vite's helper
// is `dispatchEvent(e); if (!e.defaultPrevented) throw err` — so preventing the
// default suppresses the error entirely. Doing that and then returning early would
// leave the user on a wedged page with no ErrorBoundary and no Sentry event, which
// is worse than the crash it replaced.
window.addEventListener('vite:preloadError', (event) => {
    try {
        const last = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY)) || 0;

        if (Date.now() - last < PRELOAD_RELOAD_COOLDOWN_MS) {
            return;
        }

        sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
    } catch (e) {
        // Private mode / storage disabled — no cooldown available, so let the error
        // through rather than risk a reload we cannot rate-limit.
        return;
    }

    event.preventDefault();
    window.location.reload();
});

createInertiaApp({
    // ⚠️ This suffix is appended to EVERY page title on the site, so it is
    // printed in search results and social cards for all of them — which makes it
    // a Stripe-facing surface, and the content-first ban list applies in full. It
    // read "…Gifts, Memberships, Exclusive Content & More." until 10 Aug 2026.
    title: (title) =>
        `${title || "Spenny Piggy"} - The Everything Wishlist - Content, Memberships & Custom Requests.`,
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
            <>
                <SmoothScroll />
                <Suspense fallback={null}>
                    <GlobalErrorBoundary>
                        <App {...props} />
                    </GlobalErrorBoundary>
                </Suspense>
                <OnboardingOverlay />
            </>
        );
        
        // Hide initial loading screen once React app is mounted
        setTimeout(() => {
            document.body.classList.add('app-loaded');
            // Remove the loading screen element after transition
            setTimeout(() => {
                const loadingScreen = document.getElementById('initial-loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                }
            }, 500); // Wait for CSS transition to complete
        }, 100); // Small delay to ensure app is rendered
        
        // Set up global cart refresh functions
        setupGlobalCartFunctions(props);

        // PWA app-feel (installed/standalone only; all feature-detected + try/catch)
        initGlobalHaptics();
        initAppBadge();

        // Lenis smooth-scroll runs as a SINGLE instance mounted via
        // <SmoothScroll/> (resources/js/Components/SmoothScroll.jsx). Do NOT
        // create a second Lenis here — two instances both drive window.scrollY
        // and fight, snapping the page up when a gesture stops. Only inject the
        // shared helper CSS (guarded so it runs once).
        if (typeof window !== "undefined" && !window.__lenisStyle) {
            window.__lenisStyle = true;
            const style = document.createElement("style");
            style.textContent =
                "html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}.lenis.lenis-stopped{overflow:hidden}";
            document.head.appendChild(style);
        }
    },
    progress: {
        color: "var(--pink)",
        delay: 100,
        includeCSS: true,
        showSpinner: true,
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

// Global UTM Tracking - Save UTM parameters to localStorage
if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    let utmUpdated = false;
    
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(param => {
        if (searchParams.has(param)) {
            localStorage.setItem(param, searchParams.get(param));
            utmUpdated = true;
        }
    });

    if (utmUpdated) {
        console.log("UTM parameters saved to local storage for tracking.");
    }
}

