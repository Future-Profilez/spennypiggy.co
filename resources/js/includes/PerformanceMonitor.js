/**
 * Simple performance monitoring utility
 * Logs page load times and component render times
 */

class PerformanceMonitor {
    static instance;
    
    constructor() {
        if (PerformanceMonitor.instance) {
            return PerformanceMonitor.instance;
        }
        
        this.metrics = {};
        this.componentRenders = new Map();
        PerformanceMonitor.instance = this;
        
        // Auto-initialize on page load
        if (typeof window !== 'undefined') {
            this.initPageMetrics();
        }
    }
    
    /**
     * Initialize page-level performance metrics
     */
    initPageMetrics() {
        // Measure page load time
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.logMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
                this.logMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
                this.logMetric('first_paint', this.getFirstPaint());
            }
        });
        
        // Measure resource load times
        this.measureResourceTiming();
    }
    
    /**
     * Get First Paint timing
     */
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }
    
    /**
     * Measure resource loading times
     */
    measureResourceTiming() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'resource') {
                    // Log slow resources (>500ms)
                    if (entry.duration > 500) {
                        console.warn(`Slow resource: ${entry.name} - ${Math.round(entry.duration)}ms`);
                    }
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
    }
    
    /**
     * Start timing a component render
     */
    startRender(componentName) {
        const startTime = performance.now();
        this.componentRenders.set(componentName, startTime);
        return startTime;
    }
    
    /**
     * End timing a component render
     */
    endRender(componentName) {
        const endTime = performance.now();
        const startTime = this.componentRenders.get(componentName);
        
        if (startTime) {
            const duration = endTime - startTime;
            this.logMetric(`component_${componentName}_render`, duration);
            this.componentRenders.delete(componentName);
            
            // Log slow renders (>100ms)
            if (duration > 100) {
                console.warn(`Slow render: ${componentName} - ${Math.round(duration)}ms`);
            }
            
            return duration;
        }
        
        return 0;
    }
    
    /**
     * Log a custom metric
     */
    logMetric(name, value) {
        this.metrics[name] = value;
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.info(`📊 ${name}: ${Math.round(value)}ms`);
        }
    }
    
    /**
     * Get all metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Report performance summary
     */
    reportSummary() {
        const metrics = this.getMetrics();
        const summary = {
            pageLoad: metrics.page_load_time || 0,
            domReady: metrics.dom_content_loaded || 0,
            firstPaint: metrics.first_paint || 0,
            slowComponents: Object.entries(metrics)
                .filter(([key, value]) => key.startsWith('component_') && value > 100)
                .map(([key, value]) => ({ 
                    component: key.replace('component_', '').replace('_render', ''), 
                    time: Math.round(value) 
                }))
        };
        
        console.group('🚀 Performance Summary');
        console.log('Page Load Time:', Math.round(summary.pageLoad), 'ms');
        console.log('DOM Ready Time:', Math.round(summary.domReady), 'ms');
        console.log('First Paint Time:', Math.round(summary.firstPaint), 'ms');
        
        if (summary.slowComponents.length > 0) {
            console.warn('Slow Components:', summary.slowComponents);
        }
        
        console.groupEnd();
        
        return summary;
    }
}

// React Hook for component performance monitoring
export const usePerformanceMonitor = (componentName) => {
    const monitor = new PerformanceMonitor();
    
    React.useEffect(() => {
        const startTime = monitor.startRender(componentName);
        
        return () => {
            monitor.endRender(componentName);
        };
    }, [componentName]);
    
    return monitor;
};

// Export singleton instance
export default new PerformanceMonitor();
