/**
 * Resource Preloader for Profile Pages
 * Preloads critical resources for faster subsequent page loads
 */

class ResourcePreloader {
    constructor() {
        this.preloadedResources = new Set();
        this.preloadQueue = [];
        this.isPreloading = false;
    }

    /**
     * Preload critical profile resources
     */
    preloadProfileResources() {
        const criticalResources = [
            // Critical JavaScript chunks
            { type: 'script', href: this.getAssetUrl('vendor-react'), priority: 'high' },
            { type: 'script', href: this.getAssetUrl('vendor-inertia'), priority: 'high' },
            { type: 'script', href: this.getAssetUrl('profile-pages'), priority: 'high' },
            
            // Critical CSS
            { type: 'style', href: this.getAssetUrl('app', 'css'), priority: 'high' },
            
            // Critical fonts
            { type: 'font', href: '/build/assets/CeraGRBold.woff2', priority: 'high' },
            { type: 'font', href: '/build/assets/CeraGRMedium.woff2', priority: 'high' },
            
            // Profile images (user avatars, etc.)
            { type: 'image', href: '/build/images/uploadedimg.png', priority: 'low' },
        ];

        criticalResources.forEach(resource => {
            this.preloadResource(resource);
        });
    }

    /**
     * Preload a specific resource
     */
    preloadResource({ type, href, priority = 'low' }) {
        if (this.preloadedResources.has(href)) {
            return; // Already preloaded
        }

        const link = document.createElement('link');
        
        switch (type) {
            case 'script':
                link.rel = 'modulepreload';
                link.href = href;
                break;
                
            case 'style':
                link.rel = 'preload';
                link.as = 'style';
                link.href = href;
                break;
                
            case 'font':
                link.rel = 'preload';
                link.as = 'font';
                link.type = 'font/woff2';
                link.crossOrigin = 'anonymous';
                link.href = href;
                break;
                
            case 'image':
                link.rel = 'preload';
                link.as = 'image';
                link.href = href;
                break;
                
            default:
                return;
        }

        // Set priority
        if (priority === 'high') {
            link.fetchPriority = 'high';
        }

        // Add to DOM
        document.head.appendChild(link);
        this.preloadedResources.add(href);

        // Performance tracking
        link.onload = () => {
            console.info(`✅ Preloaded: ${href}`);
        };

        link.onerror = () => {
            console.warn(`❌ Failed to preload: ${href}`);
        };
    }

    /**
     * Get asset URL from manifest
     */
    getAssetUrl(name, type = 'js') {
        // Try to get from Vite manifest
        if (typeof window !== 'undefined' && window.__vite_manifest) {
            const manifestEntry = window.__vite_manifest[`resources/${type}/${name}.${type}`];
            if (manifestEntry) {
                return `/build/${manifestEntry.file}`;
            }
        }

        // Fallback to common patterns
        return `/build/${type}/${name}.${type}`;
    }

    /**
     * Preload images for a profile
     */
    preloadProfileImages(user) {
        if (!user) return;

        const imagesToPreload = [];

        // User avatar
        if (user.avatar) {
            imagesToPreload.push(user.avatar);
        }

        // Cover image
        if (user.cover_url) {
            imagesToPreload.push(user.cover_url);
        }

        // Social image
        if (user.social_image) {
            imagesToPreload.push(`https://ucarecdn.com/${user.social_image}/-/preview/`);
        }

        imagesToPreload.forEach(href => {
            if (href) {
                this.preloadResource({ type: 'image', href, priority: 'low' });
            }
        });
    }

    /**
     * Preload fonts asynchronously
     */
    async preloadFonts() {
        const fonts = [
            { family: 'CeraGR', weight: '400', url: '/build/assets/CeraGRMedium.woff2' },
            { family: 'CeraGR', weight: '700', url: '/build/assets/CeraGRBold.woff2' },
        ];

        const fontPromises = fonts.map(async ({ family, weight, url }) => {
            try {
                const font = new FontFace(family, `url(${url})`, { weight });
                const loadedFont = await font.load();
                document.fonts.add(loadedFont);
                console.info(`🔤 Font loaded: ${family} ${weight}`);
            } catch (error) {
                console.warn(`❌ Font failed: ${family}`, error);
            }
        });

        return Promise.all(fontPromises);
    }

    /**
     * Intelligent prefetching based on user behavior
     */
    setupIntelligentPrefetch() {
        if (typeof window === 'undefined') return;

        // Prefetch resources when user hovers over profile links
        document.addEventListener('mouseover', (e) => {
            const link = e.target.closest('a[href*="/"]');
            if (link && this.isProfileLink(link.href)) {
                this.preloadProfileResources();
            }
        });

        // Prefetch on scroll (user is engaged)
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.preloadProfileResources();
            }, 1000);
        }, { passive: true });
    }

    /**
     * Check if URL is a profile link
     */
    isProfileLink(href) {
        // Simple heuristic - can be improved
        return href.match(/^\/[a-zA-Z0-9_-]+\/?$/) && !href.includes('/login');
    }

    /**
     * Initialize service worker for caching
     */
    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.info('🔧 Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.warn('❌ Service Worker failed:', error);
                });
        }
    }

    /**
     * Initialize all preloading strategies
     */
    init(user = null) {
        // Immediate preloading
        this.preloadProfileResources();
        
        // Preload user-specific images
        if (user) {
            this.preloadProfileImages(user);
        }

        // Preload fonts
        this.preloadFonts();

        // Setup intelligent prefetching
        this.setupIntelligentPrefetch();

        // Initialize service worker
        this.initServiceWorker();

        console.info('🚀 ResourcePreloader initialized');
    }
}

export default new ResourcePreloader();
