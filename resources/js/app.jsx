import React, { Children } from "./react-polyfill.js";
import { route } from 'ziggy-js';
import "./bootstrap";

window.route = route;

import "../css/fonts-optimized.css";
import "../css/theme.css";
/*
 * `core-web-vitals.css` was removed here (14 Aug 2026). It shipped 245 lines on
 * every page load and a class-by-class census found ZERO live users of any of
 * its 23 selectors — the two apparent hits were a React `key` string and a
 * filename in an examples blade, not classNames. It also carried the last
 * `:hover { transform: scale(1.05) }` in the stylesheets, which the sitewide
 * no-scale rule bans. Do not re-add it; write the rule where it is used.
 */
import "../css/index.css";
import "../css/home.css";
import "../css/app.css";
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

import { createInertiaApp } from "@inertiajs/react";
import { sendQueued, trackPageView } from "./lib/analytics";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { router } from "@inertiajs/react";

import * as Sentry from "@sentry/react";
import axios from "axios";
import DeviceID from "./includes/DeviceID";
import "./utils/pwaDebug";
import Maintaince from "./Components/Maintaince.jsx";
import SmoothScroll from "./Components/SmoothScroll.jsx";
import OnboardingOverlay from "./Components/Onboarding/OnboardingOverlay.jsx";
import NavigationProgress from "./Components/NavigationProgress.jsx";
import { initGlobalHaptics } from "./utils/hapticsGlobal";
import { initAppBadge } from "./utils/appBadge";
// ⚠️ ONE definition of the stale-chunk reload, shared with every `lazyRetry`
// call site. A second copy here would be a second cooldown timer, and two of
// those can reload each other in a loop.
import { reloadOnce } from "./utils/lazyRetry";

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
            // Same fault as the line above, the other half of it: React holds a
            // reference to a node that Google Translate, Safari Reader or a browser
            // extension has already re-parented or removed, so the reconciler asks the
            // DOM to detach a child that is no longer there. Nothing in this codebase
            // can prevent it and the page recovers on the next render — ignoring only
            // `insertBefore` meant half of one known issue was filtered and half was
            // still paging us (JAVASCRIPT-REACT-8Y).
            "NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
            "TypeError: Load failed",
            "TypeError: null is not an object (evaluating 'i.cdnUrl')",
            "Error: Response not ok: 403",
            // 🚨 THE ANDROID WEBVIEW JS BRIDGE, NOT OUR CODE. An in-app browser
            // (Facebook, Instagram, Twitter…) injects `@JavascriptInterface` objects
            // into every page it opens, and when one of those native methods throws,
            // the WebView surfaces it as a page error attributed to US. The method
            // name varies — `enableDidUserTypeOnKeyboardLogging` was filtered, and
            // `postMessage` then arrived as a fresh issue (JAVASCRIPT-REACT-9K) and
            // paged us again. ⚠️ The two SUFFIXES are the stable part, so the regex in
            // `beforeSend` matches on those rather than on any method name; these two
            // literals stay only because `ignoreErrors` does substring matching and
            // costs nothing.
            //
            // ⚠️ Our own `postMessage` calls are web-worker-only
            // (`hooks/useWebWorker.js`), so a real fault of ours could not produce
            // this wording. Verified before filtering — do not widen this to plain
            // "postMessage".
            "Error: Error invoking enableDidUserTypeOnKeyboardLogging: Java object is gone",
            "Error: Error invoking postMessage: Java exception was raised during method invocation",
            // The iOS half of the same family: `window.webkit.messageHandlers` is
            // WKWebView's native bridge, and an in-app browser (Instagram, Facebook)
            // tears it down when it navigates away while its own injected script is
            // still reaching for it. ⚠️ Verified before filtering: `window.webkit`
            // appears NOWHERE in `resources/js` — a real fault of ours could not
            // produce this. Both instances so far were on a `/{username}/bio` page,
            // which is exactly what an Instagram bio link opens.
            "TypeError: undefined is not an object (evaluating 'window.webkit.messageHandlers')",
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
                /permission denied|request is not allowed by the user agent|play\(\) failed because the user didn't interact|load failed|network error|response not ok:\s*403|(?:insertBefore|removeChild).*not a child of this node|abort due to cancellation of share|Java object is gone|Java exception was raised during method invocation|window\.webkit\.messageHandlers|The string did not match the expected pattern/i.test(value)
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

// preventDefault() is called ONLY on the path that actually reloads. Vite's helper
// is `dispatchEvent(e); if (!e.defaultPrevented) throw err` — so preventing the
// default suppresses the error entirely. Doing that and then returning early would
// leave the user on a wedged page with no ErrorBoundary and no Sentry event, which
// is worse than the crash it replaced.
window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce()) {
        event.preventDefault();
    }
});

createInertiaApp({
    // ⚠️ This suffix is appended to EVERY page title on the site, so it is
    // printed in search results and social cards for all of them — which makes it
    // a Stripe-facing surface, and the content-first ban list applies in full. It
    // read "…Gifts, Memberships, Exclusive Content & More." until 10 Aug 2026.
    title: (title) =>
        `${title || "Spenny Piggy"} - The Everything Wishlist - Content, Memberships & Custom Requests.`,
    resolve: (name) => {
        /*
         * 🚨 A MISSING COMPONENT NAME MUST NOT BE CONCATENATED INTO A PATH.
         *
         * Inertia hands `resolve` whatever `page.component` was, and a response
         * that is not an Inertia payload (a bare `response()->json()`, an error
         * page, a truncated body) leaves it undefined — which produced
         * `Error: Page not found: ./Pages/undefined.jsx` in production, a blank
         * screen with a message naming a file nobody wrote. The page is stale or
         * the response was not Inertia's; either way a reload is the recovery,
         * and the same cooldown as `vite:preloadError` keeps it from looping.
         */
        if (!name) {
            const err = new Error(
                "Inertia resolved a page with no component name"
            );

            try {
                Sentry.captureException(err);
            } catch (e) {
            }

            if (reloadOnce()) {
                // Never settle — the page is going away.
                return new Promise(() => {});
            }

            throw err;
        }

        /*
         * 🚨 A PAGE CHUNK CAN RESOLVE TO A MODULE WITH NO `default`, AND THERE IS NO
         * ERROR TO CATCH — the promise SUCCEEDS. Inertia then reads `.default` off
         * it and dies with `undefined is not an object (evaluating 's.default')`
         * (JAVASCRIPT-REACT-9W), which is a blank screen with a minified variable
         * name for a message.
         *
         * `vite:preloadError` does not fire (nothing failed to fetch) and
         * `utils/lazyRetry.js` does not cover this path — that wraps `React.lazy`,
         * and the Inertia PAGE component is resolved here instead. Same cause as
         * `lazyRetry`'s: a service worker handing back a stale entry across a
         * deploy. Same recovery, and deliberately the SAME cooldown key, because
         * two independent reload timers can reload each other in a loop.
         */
        return resolvePageComponent(
            `./Pages/${name}.jsx`,
            // Use eager: false for better code splitting
            import.meta.glob("./Pages/**/*.jsx", { eager: false })
        ).then((module) => {
            if (module && module.default) {
                return module;
            }

            try {
                Sentry.captureException(
                    new Error(`Page chunk resolved with no default export: ${name}`)
                );
            } catch (e) {
            }

            if (reloadOnce()) {
                // Never settle — the page is going away. Settling would let Inertia
                // render the broken module during the reload.
                return new Promise(() => {});
            }

            throw new Error(
                `Page chunk resolved with no default export: ${name}`
            );
        });
    },
    setup({ el, App, props }) {
        // The first render never fires router `success`, so a milestone that lands on a full
        // document load (every Stripe return, every e-mailed verification link) would be lost.
        sendQueued(props?.initialPage?.props);

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
                {/* Sibling of <App>, never inside it: it must survive the page
                    component being swapped out, which is the whole moment it
                    exists to cover. Runs in every context; it self-throttles by
                    waiting longer in a browser tab, which already has the top
                    bar and the OS tap highlight. */}
                <NavigationProgress />
            </>
        );
        
        // 🚨 The launch screen comes down when the app has PAINTED, not when it has
        // mounted. `<Suspense fallback={null}>` above means a lazy page chunk renders
        // NOTHING while it loads, so the old fixed 100ms handed the user an empty
        // `#app` over the black body for as long as that chunk took — reported from
        // the installed app as "a black screen after 3-4 seconds", and as a black
        // band along the bottom of the launch screen while the webview was still
        // painting. Neither was a splash bug; both were the gap after it.
        const revealApp = () => {
            // Returns the installed app's window backdrop to black. See the
            // `sp-launched` note in app.blade.php — while the launch screen is up
            // the backdrop is pink, so an unpainted region cannot show as black.
            document.documentElement.classList.add('sp-launched');
            document.body.classList.add('app-loaded');
            setTimeout(() => {
                const loadingScreen = document.getElementById('initial-loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                }
            }, 500); // Wait for the CSS transition to complete
        };

        // ⚠️ CAPPED, and the 8s boot watchdog in app.blade.php is still the final
        // backstop. A page that legitimately renders nothing — or a chunk that never
        // arrives — must never be able to trap someone behind the launch screen.
        const REVEAL_TIMEOUT_MS = 6000;
        const waitedFrom = Date.now();

        const hasPainted = () => {
            // #app is in normal flow, so it only gains height once a page component
            // has actually rendered content. A fixed-position sibling (the nav
            // progress bar) is out of flow and cannot satisfy this by itself.
            const height = el?.getBoundingClientRect?.().height ?? 0;

            return height > 0;
        };

        const waitForPaint = () => {
            if (hasPainted() || Date.now() - waitedFrom > REVEAL_TIMEOUT_MS) {
                revealApp();

                return;
            }

            requestAnimationFrame(waitForPaint);
        };

        requestAnimationFrame(waitForPaint);


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
        // Colour is defined once, as `--progress` in theme.css. See the note
        // there: pink drew the bar on top of the pink fixed header.
        color: "var(--progress)",
        delay: 100,
        includeCSS: true,
        /*
         * ⚠️ NProgress's spinner is OFF (15 Aug 2026). `NavigationProgress` now
         * covers every context rather than the installed app alone, so the
         * spinner became a SECOND indeterminate indicator for the same wait,
         * drawn in a different vocabulary in the opposite corner. The two-tier
         * design is deliberate and unchanged: the bar (100ms) answers a fast
         * navigation, the veil (160/280ms) answers a slow one.
         */
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

// GA4 page views on Inertia navigation.
//
// gtag('config', …) in the <head> fires exactly once, on the initial document load. This is an
// SPA, so without this every page after the first is invisible to GA4 and the property reports
// one page view per session. No-op if the tag has not loaded (blocked, offline, dev).
//
// `trackPageView` also attaches `page_group`, which is what makes profile traffic countable at
// all — see resources/js/lib/analytics.js.
router.on('navigate', () => {
    trackPageView();
});

// Server-emitted funnel events (signup, email verified, Stripe connected, published, purchase).
//
// ⚠️ On `success`, not `navigate`: the props for the page being landed on are only present on
// the success event, and `props.analytics` is where the server put them. A redirect is exactly
// the shape of every funnel milestone here, which is why they cannot be fired from a component.
router.on('success', (event) => {
    sendQueued(event?.detail?.page?.props);
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

