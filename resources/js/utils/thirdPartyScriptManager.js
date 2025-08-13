/**
 * Third-Party Script Governance Manager
 * 
 * Manages lazy loading of third-party scripts to improve performance
 * and implement proper governance over external integrations.
 */

class ThirdPartyScriptManager {
    constructor() {
        this.loadedScripts = new Set();
        this.loadingPromises = new Map();
    }

    /**
     * Lazy load a script after user interaction or idle time
     * @param {Object} config - Script configuration
     * @param {string} config.id - Unique identifier for the script
     * @param {string} config.src - Script source URL
     * @param {Function} config.onLoad - Callback function after script loads
     * @param {Array} config.events - Events to trigger loading (default: ['click', 'scroll', 'touchstart', 'keydown'])
     * @param {number} config.delay - Delay in milliseconds for fallback loading (default: 5000)
     * @param {boolean} config.async - Whether script should be async (default: true)
     * @param {string} config.importance - Script importance level ('high', 'low', 'auto')
     * @param {Object} config.attributes - Additional script attributes
     */
    async lazyLoadScript(config) {
        const {
            id,
            src,
            onLoad,
            events = ['click', 'scroll', 'touchstart', 'keydown'],
            delay = 5000,
            async = true,
            importance = 'low',
            attributes = {}
        } = config;

        // Return existing promise if script is already being loaded
        if (this.loadingPromises.has(id)) {
            return this.loadingPromises.get(id);
        }

        // Return resolved promise if script is already loaded
        if (this.loadedScripts.has(id)) {
            return Promise.resolve();
        }

        // Create loading promise
        const loadingPromise = new Promise((resolve, reject) => {
            const loadScript = () => {
                if (this.loadedScripts.has(id)) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = src;
                script.async = async;
                
                if (importance) {
                    script.importance = importance;
                }

                // Set additional attributes
                Object.entries(attributes).forEach(([key, value]) => {
                    script.setAttribute(key, value);
                });

                script.onload = () => {
                    this.loadedScripts.add(id);
                    this.loadingPromises.delete(id);
                    if (onLoad) onLoad();
                    resolve();
                };

                script.onerror = () => {
                    this.loadingPromises.delete(id);
                    reject(new Error(`Failed to load script: ${src}`));
                };

                document.head.appendChild(script);
            };

            // Load on user interaction
            const loadOnInteraction = () => {
                loadScript();
                // Remove event listeners after loading
                events.forEach(event => {
                    document.removeEventListener(event, loadOnInteraction);
                });
            };

            // Add event listeners for user interaction
            events.forEach(event => {
                document.addEventListener(event, loadOnInteraction, { 
                    once: true, 
                    passive: true 
                });
            });

            // Fallback: Load after idle time
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    setTimeout(loadScript, delay);
                });
            } else {
                setTimeout(loadScript, delay);
            }
        });

        this.loadingPromises.set(id, loadingPromise);
        return loadingPromise;
    }

    /**
     * Load Google Analytics with lazy loading
     * @param {string} trackingId - GA tracking ID
     * @param {Object} config - Additional configuration
     */
    async loadGoogleAnalytics(trackingId, config = {}) {
        return this.lazyLoadScript({
            id: 'google-analytics',
            src: `https://www.googletagmanager.com/gtag/js?id=${trackingId}`,
            onLoad: () => {
                window.dataLayer = window.dataLayer || [];
                function gtag() {
                    dataLayer.push(arguments);
                }
                gtag('js', new Date());
                gtag('config', trackingId, config);
                window.gtag = gtag;
            },
            delay: config.delay || 5000,
            ...config
        });
    }

    /**
     * Load Intercom chat widget with lazy loading
     * @param {string} appId - Intercom app ID
     * @param {Object} settings - Intercom settings
     * @param {Object} config - Additional configuration
     */
    async loadIntercom(appId, settings = {}, config = {}) {
        return new Promise((resolve) => {
            const loadIntercomWidget = () => {
                if (this.loadedScripts.has('intercom')) {
                    resolve();
                    return;
                }

                window.intercomSettings = {
                    app_id: appId,
                    ...settings
                };

                (function () {
                    var w = window;
                    var ic = w.Intercom;
                    if (typeof ic === "function") {
                        ic("reattach_activator");
                        ic("update", w.intercomSettings);
                    } else {
                        var d = document;
                        var i = function () {
                            i.c(arguments);
                        };
                        i.q = [];
                        i.c = function (args) {
                            i.q.push(args);
                        };
                        w.Intercom = i;
                        
                        var l = function () {
                            var s = d.createElement("script");
                            s.type = "text/javascript";
                            s.async = true;
                            s.defer = true;
                            s.importance = "low";
                            s.src = `https://widget.intercom.io/widget/${appId}`;
                            var x = d.getElementsByTagName("script")[0];
                            x.parentNode.insertBefore(s, x);
                        };

                        if ('requestIdleCallback' in window) {
                            requestIdleCallback(l);
                        } else {
                            setTimeout(l, 100);
                        }
                    }
                })();

                this.loadedScripts.add('intercom');
                resolve();
            };

            const events = config.events || ['click', 'scroll', 'touchstart', 'keydown'];
            
            // Load on user interaction
            const loadOnInteraction = () => {
                loadIntercomWidget();
                events.forEach(event => {
                    document.removeEventListener(event, loadOnInteraction);
                });
            };

            events.forEach(event => {
                document.addEventListener(event, loadOnInteraction, { 
                    once: true, 
                    passive: true 
                });
            });

            // Fallback: Load after idle time
            const delay = config.delay || 8000;
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    setTimeout(loadIntercomWidget, delay);
                });
            } else {
                setTimeout(loadIntercomWidget, delay);
            }
        });
    }

    /**
     * Load Twitter Ads tracking with lazy loading
     * @param {string} pixelId - Twitter pixel ID
     * @param {Object} config - Additional configuration
     */
    async loadTwitterAds(pixelId, config = {}) {
        return new Promise((resolve) => {
            const loadTwitterAds = () => {
                if (this.loadedScripts.has('twitter-ads')) {
                    resolve();
                    return;
                }

                !function(e,t,n,s,u,a){
                    e.twq||(s=e.twq=function(){
                        s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
                    },s.version='1.1',s.queue=[],u=t.createElement(n),
                    u.async=!0,u.importance='low',u.src='https://static.ads-twitter.com/uwt.js',
                    a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))
                }(window,document,'script');
                
                twq('config', pixelId);
                this.loadedScripts.add('twitter-ads');
                resolve();
            };

            const events = config.events || ['click', 'scroll', 'keydown', 'touchstart'];
            
            // Load on user interaction
            const loadOnInteraction = () => {
                loadTwitterAds();
                events.forEach(event => {
                    document.removeEventListener(event, loadOnInteraction);
                });
            };

            events.forEach(event => {
                document.addEventListener(event, loadOnInteraction, { 
                    once: true, 
                    passive: true 
                });
            });

            // Fallback: Load after idle time
            const delay = config.delay || 5000;
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    setTimeout(loadTwitterAds, delay);
                });
            } else {
                setTimeout(loadTwitterAds, delay);
            }
        });
    }

    /**
     * Load Trustpilot widget with lazy loading
     * @param {Object} config - Configuration options
     */
    async loadTrustpilot(config = {}) {
        return this.lazyLoadScript({
            id: 'trustpilot',
            src: '//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js',
            delay: config.delay || 3000,
            ...config
        });
    }

    /**
     * Create iframe with lazy loading support
     * @param {Object} config - Iframe configuration
     * @param {string} config.src - Iframe source URL
     * @param {string} config.dataSrc - Data source for lazy loading
     * @param {HTMLElement} config.container - Container element
     * @param {Object} config.attributes - Additional iframe attributes
     */
    createLazyIframe(config) {
        const {
            src,
            dataSrc,
            container,
            attributes = {}
        } = config;

        const iframe = document.createElement('iframe');
        
        // Use data-src for lazy loading
        if (dataSrc) {
            iframe.setAttribute('data-src', dataSrc);
        } else {
            iframe.src = src;
        }

        // Add low importance for ads/non-critical iframes
        iframe.importance = attributes.importance || 'low';
        iframe.loading = attributes.loading || 'lazy';

        // Set additional attributes
        Object.entries(attributes).forEach(([key, value]) => {
            iframe.setAttribute(key, value);
        });

        // Load iframe on user interaction for better performance
        const loadIframe = () => {
            if (iframe.getAttribute('data-src')) {
                iframe.src = iframe.getAttribute('data-src');
                iframe.removeAttribute('data-src');
            }
        };

        // Load on scroll or interaction
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        loadIframe();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            if (container) {
                container.appendChild(iframe);
                observer.observe(iframe);
            }
        } else {
            // Fallback for older browsers
            setTimeout(loadIframe, 2000);
            if (container) {
                container.appendChild(iframe);
            }
        }

        return iframe;
    }

    /**
     * Check if a script has been loaded
     * @param {string} id - Script identifier
     * @returns {boolean}
     */
    isScriptLoaded(id) {
        return this.loadedScripts.has(id);
    }

    /**
     * Remove all event listeners and clean up
     */
    cleanup() {
        this.loadedScripts.clear();
        this.loadingPromises.clear();
    }
}

// Export singleton instance
export default new ThirdPartyScriptManager();
