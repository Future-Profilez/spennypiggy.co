/**
 * Optimized Polyfill Manager
 * 
 * Only loads essential polyfills based on browser support detection
 * Helps reduce Total Blocking Time (TBT) by minimizing unnecessary polyfills
 */

class PolyfillManager {
    constructor() {
        this.loadedPolyfills = new Set();
        this.browserSupport = this.detectBrowserSupport();
    }

    /**
     * Detect browser support for various APIs
     */
    detectBrowserSupport() {
        const support = {
            // ES2015+ Features
            promises: typeof Promise !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            intersectionObserver: 'IntersectionObserver' in window,
            resizeObserver: 'ResizeObserver' in window,
            
            // Modern JavaScript Features
            asyncAwait: this.supportsAsyncAwait(),
            destructuring: this.supportsDestructuring(),
            arrowFunctions: this.supportsArrowFunctions(),
            
            // Web APIs
            webWorkers: typeof Worker !== 'undefined',
            serviceWorkers: 'serviceWorker' in navigator,
            requestIdleCallback: 'requestIdleCallback' in window,
            requestAnimationFrame: 'requestAnimationFrame' in window,
            
            // CSS Features
            cssGrid: CSS.supports('display', 'grid'),
            cssFlexbox: CSS.supports('display', 'flex'),
            cssAspectRatio: CSS.supports('aspect-ratio', '16/9'),
            
            // Image/Media Features
            webp: null, // Will be detected asynchronously
            avif: null, // Will be detected asynchronously
            
            // Browser Info
            isModern: this.isModernBrowser(),
            isIE11: this.isIE11()
        };

        return support;
    }

    /**
     * Load only necessary polyfills based on browser support
     */
    async loadEssentialPolyfills() {
        const polyfillsToLoad = [];

        // Critical polyfills for older browsers
        if (!this.browserSupport.promises) {
            polyfillsToLoad.push(this.loadPromisePolyfill());
        }

        if (!this.browserSupport.fetch) {
            polyfillsToLoad.push(this.loadFetchPolyfill());
        }

        if (!this.browserSupport.intersectionObserver) {
            polyfillsToLoad.push(this.loadIntersectionObserverPolyfill());
        }

        if (!this.browserSupport.requestIdleCallback) {
            polyfillsToLoad.push(this.loadRequestIdleCallbackPolyfill());
        }

        // Only load if we actually need them
        if (polyfillsToLoad.length > 0) {
            try {
                await Promise.all(polyfillsToLoad);
            } catch (error) {
                console.warn('Some polyfills failed to load:', error);
            }
        }
    }

    /**
     * Load non-essential polyfills on demand
     */
    async loadOnDemandPolyfills(features = []) {
        const polyfillsToLoad = [];

        features.forEach(feature => {
            switch (feature) {
                case 'resizeObserver':
                    if (!this.browserSupport.resizeObserver) {
                        polyfillsToLoad.push(this.loadResizeObserverPolyfill());
                    }
                    break;
                    
                case 'webAnimations':
                    if (!('animate' in Element.prototype)) {
                        polyfillsToLoad.push(this.loadWebAnimationsPolyfill());
                    }
                    break;
                    
                case 'smoothScroll':
                    if (!('scrollBehavior' in document.documentElement.style)) {
                        polyfillsToLoad.push(this.loadSmoothScrollPolyfill());
                    }
                    break;
            }
        });

        if (polyfillsToLoad.length > 0) {
            try {
                await Promise.all(polyfillsToLoad);
            } catch (error) {
                console.warn('Some on-demand polyfills failed to load:', error);
            }
        }
    }

    // Polyfill loaders - using CDN or inline code for minimal bundles
    async loadPromisePolyfill() {
        if (this.loadedPolyfills.has('promise')) return;
        
        return new Promise((resolve, reject) => {
            // Minimal Promise polyfill for IE11
            if (typeof Promise === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js';
                script.onload = () => {
                    this.loadedPolyfills.add('promise');
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                resolve();
            }
        });
    }

    async loadFetchPolyfill() {
        if (this.loadedPolyfills.has('fetch')) return;
        
        return new Promise((resolve, reject) => {
            if (typeof fetch === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/whatwg-fetch@3/dist/fetch.umd.js';
                script.onload = () => {
                    this.loadedPolyfills.add('fetch');
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                resolve();
            }
        });
    }

    async loadIntersectionObserverPolyfill() {
        if (this.loadedPolyfills.has('intersectionObserver')) return;
        
        return new Promise((resolve, reject) => {
            if (!('IntersectionObserver' in window)) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/intersection-observer@0.12.2/intersection-observer.js';
                script.onload = () => {
                    this.loadedPolyfills.add('intersectionObserver');
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                resolve();
            }
        });
    }

    async loadRequestIdleCallbackPolyfill() {
        if (this.loadedPolyfills.has('requestIdleCallback')) return;
        
        // Inline minimal polyfill to avoid extra network request
        if (!('requestIdleCallback' in window)) {
            window.requestIdleCallback = function(callback, options = {}) {
                const timeout = options.timeout || 0;
                const startTime = performance.now();
                
                return setTimeout(() => {
                    callback({
                        didTimeout: false,
                        timeRemaining() {
                            return Math.max(0, 50 - (performance.now() - startTime));
                        }
                    });
                }, timeout);
            };
            
            window.cancelIdleCallback = function(id) {
                clearTimeout(id);
            };
            
            this.loadedPolyfills.add('requestIdleCallback');
        }
        
        return Promise.resolve();
    }

    async loadResizeObserverPolyfill() {
        if (this.loadedPolyfills.has('resizeObserver')) return;
        
        return new Promise((resolve, reject) => {
            if (!('ResizeObserver' in window)) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@juggle/resize-observer@3/lib/exports/resize-observer.umd.js';
                script.onload = () => {
                    this.loadedPolyfills.add('resizeObserver');
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                resolve();
            }
        });
    }

    async loadWebAnimationsPolyfill() {
        if (this.loadedPolyfills.has('webAnimations')) return;
        
        return new Promise((resolve, reject) => {
            if (!('animate' in Element.prototype)) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/web-animations-js@2/web-animations.min.js';
                script.onload = () => {
                    this.loadedPolyfills.add('webAnimations');
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                resolve();
            }
        });
    }

    async loadSmoothScrollPolyfill() {
        if (this.loadedPolyfills.has('smoothScroll')) return;
        
        // Inline minimal smooth scroll polyfill
        if (!('scrollBehavior' in document.documentElement.style)) {
            // Simple smooth scroll implementation
            const originalScrollTo = window.scrollTo;
            window.scrollTo = function(options) {
                if (typeof options === 'object' && options.behavior === 'smooth') {
                    const startY = window.pageYOffset;
                    const targetY = options.top || 0;
                    const distance = targetY - startY;
                    const duration = 300;
                    let startTime = null;

                    function animation(currentTime) {
                        if (startTime === null) startTime = currentTime;
                        const timeElapsed = currentTime - startTime;
                        const progress = Math.min(timeElapsed / duration, 1);
                        
                        // Easing function
                        const ease = progress * (2 - progress);
                        window.scrollTo(0, startY + distance * ease);
                        
                        if (timeElapsed < duration) {
                            requestAnimationFrame(animation);
                        }
                    }
                    
                    requestAnimationFrame(animation);
                } else {
                    originalScrollTo.apply(this, arguments);
                }
            };
            
            this.loadedPolyfills.add('smoothScroll');
        }
        
        return Promise.resolve();
    }

    // Feature detection helpers
    supportsAsyncAwait() {
        try {
            eval('async function test() { await Promise.resolve(); }');
            return true;
        } catch (e) {
            return false;
        }
    }

    supportsDestructuring() {
        try {
            eval('const {a} = {a: 1}');
            return true;
        } catch (e) {
            return false;
        }
    }

    supportsArrowFunctions() {
        try {
            eval('() => {}');
            return true;
        } catch (e) {
            return false;
        }
    }

    isModernBrowser() {
        // Check for modern browser features
        return !!(
            window.fetch &&
            window.Promise &&
            window.Symbol &&
            window.WeakMap &&
            [].includes &&
            Object.assign
        );
    }

    isIE11() {
        return !!(window.MSInputMethodContext && document.documentMode);
    }

    /**
     * Get minimal polyfill bundle for current browser
     */
    getPolyfillBundle() {
        if (this.browserSupport.isModern) {
            return []; // No polyfills needed
        }

        const bundle = [];

        if (this.browserSupport.isIE11) {
            bundle.push(
                'Promise',
                'fetch',
                'IntersectionObserver',
                'requestIdleCallback',
                'Object.assign',
                'Array.prototype.includes'
            );
        } else {
            // Only include what's actually missing
            if (!this.browserSupport.promises) bundle.push('Promise');
            if (!this.browserSupport.fetch) bundle.push('fetch');
            if (!this.browserSupport.intersectionObserver) bundle.push('IntersectionObserver');
            if (!this.browserSupport.requestIdleCallback) bundle.push('requestIdleCallback');
        }

        return bundle;
    }

    /**
     * Initialize polyfills based on current page requirements
     */
    async initialize(pageRequirements = []) {
        // Always load essential polyfills
        await this.loadEssentialPolyfills();

        // Load page-specific polyfills
        if (pageRequirements.length > 0) {
            await this.loadOnDemandPolyfills(pageRequirements);
        }

        // Log polyfill status for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('Polyfill Manager initialized:', {
                browserSupport: this.browserSupport,
                loadedPolyfills: Array.from(this.loadedPolyfills),
                bundle: this.getPolyfillBundle()
            });
        }
    }
}

// Export singleton instance
export default new PolyfillManager();
