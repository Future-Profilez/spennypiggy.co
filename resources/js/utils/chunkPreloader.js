/**
 * Intelligent chunk preloader for route-based code splitting
 * Preloads chunks based on user interactions and navigation patterns
 */

class ChunkPreloader {
    constructor() {
        this.preloadedChunks = new Set();
        this.preloadQueue = new Set();
        this.isPreloading = false;
        this.setupIntersectionObserver();
        this.setupHoverPreloading();
    }

    /**
     * Setup intersection observer for link preloading
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const link = entry.target;
                        const href = link.href || link.dataset.href;
                        if (href) {
                            this.schedulePreload(this.getPageFromUrl(href));
                        }
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }
    }

    /**
     * Setup hover-based preloading for navigation links
     */
    setupHoverPreloading() {
        document.addEventListener('mouseenter', (e) => {
            // Check if target exists and has closest method
            if (!e.target || typeof e.target.closest !== 'function') {
                return;
            }
            
            const link = e.target.closest('a[href]');
            if (link && this.isInternalLink(link.href)) {
                const page = this.getPageFromUrl(link.href);
                this.schedulePreload(page);
            }
        }, { capture: true, passive: true });
    }

    /**
     * Schedule chunk preloading
     */
    schedulePreload(pageName) {
        if (!pageName || this.preloadedChunks.has(pageName) || this.preloadQueue.has(pageName)) {
            return;
        }

        this.preloadQueue.add(pageName);
        
        // Use requestIdleCallback if available, otherwise fallback to setTimeout
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.preloadChunk(pageName));
        } else {
            setTimeout(() => this.preloadChunk(pageName), 0);
        }
    }

    /**
     * Preload a specific chunk
     */
    async preloadChunk(pageName) {
        if (this.preloadedChunks.has(pageName) || this.isPreloading) {
            return;
        }

        try {
            this.isPreloading = true;
            
            // Dynamic import of the page component
            await import(`../Pages/${pageName}.jsx`);
            
            this.preloadedChunks.add(pageName);
            this.preloadQueue.delete(pageName);
            
            console.log(`Preloaded chunk: ${pageName}`);
        } catch (error) {
            console.warn(`Failed to preload chunk ${pageName}:`, error);
            this.preloadQueue.delete(pageName);
        } finally {
            this.isPreloading = false;
        }
    }

    /**
     * Extract page name from URL
     */
    getPageFromUrl(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            const pathname = urlObj.pathname;
            
            // Map common routes to page components
            const routeMapping = {
                '/': 'Dashboard',
                '/dashboard': 'Dashboard',
                '/profile': 'Profile/Edit',
                '/login': 'Auth/Login',
                '/register': 'Auth/Register',
                '/lists': 'Lists',
                '/cart': 'GetCart'
            };

            return routeMapping[pathname] || this.inferPageFromPath(pathname);
        } catch {
            return null;
        }
    }

    /**
     * Infer page component from path
     */
    inferPageFromPath(pathname) {
        const segments = pathname.split('/').filter(Boolean);
        
        if (segments.length === 0) return 'Dashboard';
        
        // Convert URL segments to likely component names
        return segments.map(segment => 
            segment.charAt(0).toUpperCase() + segment.slice(1)
        ).join('/');
    }

    /**
     * Check if link is internal
     */
    isInternalLink(href) {
        try {
            const url = new URL(href, window.location.origin);
            return url.origin === window.location.origin;
        } catch {
            return false;
        }
    }

    /**
     * Observe links for viewport-based preloading
     */
    observeLinks() {
        if (this.observer) {
            document.querySelectorAll('a[href]').forEach(link => {
                if (this.isInternalLink(link.href)) {
                    this.observer.observe(link);
                }
            });
        }
    }

    /**
     * Preload critical chunks based on current page
     */
    preloadCriticalChunks(currentPage) {
        const criticalPages = this.getCriticalPages(currentPage);
        criticalPages.forEach(page => this.schedulePreload(page));
    }

    /**
     * Get critical pages to preload based on current page
     */
    getCriticalPages(currentPage) {
        const preloadStrategy = {
            'Dashboard': ['Lists', 'Profile/Edit'],
            'Auth/Login': ['Dashboard', 'Auth/Register'],
            'Auth/Register': ['Dashboard', 'Auth/Login'],
            'Lists': ['Dashboard', 'GetCart'],
            'Profile/Edit': ['Dashboard', 'Lists']
        };

        return preloadStrategy[currentPage] || [];
    }
}

// Create and export singleton instance
const chunkPreloader = new ChunkPreloader();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        chunkPreloader.observeLinks();
    });
} else {
    chunkPreloader.observeLinks();
}

export default chunkPreloader;
