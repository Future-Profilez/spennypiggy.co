import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Custom hook for memoizing expensive computations
 */
export function useMemoizedValue(computeValue, dependencies = []) {
    return useMemo(computeValue, dependencies);
}

/**
 * Custom hook for stable callback references
 */
export function useStableCallback(callback, dependencies = []) {
    return useCallback(callback, dependencies);
}

/**
 * Custom hook for debouncing values (performance optimization for search/filters)
 */
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for throttling functions (performance optimization for scroll/resize)
 */
export function useThrottle(callback, delay) {
    const lastRun = useRef(Date.now());

    return useCallback((...args) => {
        if (Date.now() - lastRun.current >= delay) {
            callback(...args);
            lastRun.current = Date.now();
        }
    }, [callback, delay]);
}

/**
 * Custom hook for intersection observer (lazy loading/virtualization)
 */
export function useIntersectionObserver(options = {}) {
    const [entry, setEntry] = useState(null);
    const elementRef = useRef(null);

    const {
        threshold = 0,
        root = null,
        rootMargin = '0%',
        freezeOnceVisible = false
    } = options;

    const frozen = entry?.isIntersecting && freezeOnceVisible;

    const updateEntry = useCallback(([entry]) => {
        setEntry(entry);
    }, []);

    useEffect(() => {
        const node = elementRef.current;
        const hasIOSupport = !!window.IntersectionObserver;

        if (!hasIOSupport || frozen || !node) return;

        const observerParams = { threshold, root, rootMargin };
        const observer = new IntersectionObserver(updateEntry, observerParams);

        observer.observe(node);

        return () => observer.disconnect();
    }, [elementRef, threshold, root, rootMargin, frozen, updateEntry]);

    return [elementRef, entry];
}

/**
 * Custom hook for virtual scrolling (performance optimization for large lists)
 */
export function useVirtualList({
    items,
    itemHeight,
    containerHeight,
    overscan = 3
}) {
    const [scrollTop, setScrollTop] = useState(0);

    const visibleStartIndex = useMemo(() => {
        return Math.floor(scrollTop / itemHeight);
    }, [scrollTop, itemHeight]);

    const visibleEndIndex = useMemo(() => {
        return Math.min(
            visibleStartIndex + Math.ceil(containerHeight / itemHeight),
            items.length - 1
        );
    }, [visibleStartIndex, containerHeight, itemHeight, items.length]);

    const visibleItems = useMemo(() => {
        const start = Math.max(0, visibleStartIndex - overscan);
        const end = Math.min(items.length - 1, visibleEndIndex + overscan);
        
        return items.slice(start, end + 1).map((item, index) => ({
            ...item,
            index: start + index
        }));
    }, [items, visibleStartIndex, visibleEndIndex, overscan]);

    const totalHeight = items.length * itemHeight;
    const offsetY = Math.max(0, (visibleStartIndex - overscan) * itemHeight);

    const onScroll = useCallback((event) => {
        setScrollTop(event.currentTarget.scrollTop);
    }, []);

    return {
        visibleItems,
        totalHeight,
        offsetY,
        onScroll
    };
}

/**
 * Custom hook for managing component state with optimistic updates
 */
export function useOptimisticState(initialState, updateFunction) {
    const [optimisticState, setOptimisticState] = useState(initialState);
    const [actualState, setActualState] = useState(initialState);
    const [isPending, setIsPending] = useState(false);

    const updateOptimistically = useCallback(async (optimisticUpdate, actualUpdate) => {
        // Apply optimistic update immediately
        setOptimisticState(current => optimisticUpdate(current));
        setIsPending(true);

        try {
            // Perform actual update
            const result = await actualUpdate();
            
            // Update actual state with server response
            setActualState(result);
            setOptimisticState(result);
            setIsPending(false);
            
            return result;
        } catch (error) {
            // Revert optimistic update on error
            setOptimisticState(actualState);
            setIsPending(false);
            throw error;
        }
    }, [actualState]);

    return {
        state: optimisticState,
        isPending,
        updateOptimistically
    };
}

/**
 * Custom hook for preloading routes/components
 */
export function usePreloader() {
    const preloadedRoutes = useRef(new Set());

    const preloadRoute = useCallback((routeName) => {
        if (preloadedRoutes.current.has(routeName)) return;

        // Mark as preloading
        preloadedRoutes.current.add(routeName);

        // Dynamically import the route component
        import(`../Pages/${routeName}.jsx`)
            .then(() => {
                console.debug(`Route ${routeName} preloaded successfully`);
            })
            .catch(error => {
                console.warn(`Failed to preload route ${routeName}:`, error);
                preloadedRoutes.current.delete(routeName);
            });
    }, []);

    const preloadMultipleRoutes = useCallback((routeNames) => {
        routeNames.forEach(preloadRoute);
    }, [preloadRoute]);

    return {
        preloadRoute,
        preloadMultipleRoutes,
        preloadedRoutes: preloadedRoutes.current
    };
}

/**
 * Custom hook for performance monitoring
 */
export function usePerformanceMonitor(componentName) {
    const renderStartTime = useRef(Date.now());
    const [renderMetrics, setRenderMetrics] = useState({
        renderTime: 0,
        renderCount: 0
    });

    useEffect(() => {
        const renderTime = Date.now() - renderStartTime.current;
        
        setRenderMetrics(prev => ({
            renderTime,
            renderCount: prev.renderCount + 1
        }));

        // Log slow renders
        if (renderTime > 16) { // > 1 frame at 60fps
            console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
        }

        renderStartTime.current = Date.now();
    });

    return renderMetrics;
}

/**
 * Custom hook for managing focus performance
 */
export function useFocusManagement() {
    const focusedElement = useRef(null);

    const setFocus = useCallback((element) => {
        if (element && element !== focusedElement.current) {
            // Batch focus changes
            requestAnimationFrame(() => {
                element.focus();
                focusedElement.current = element;
            });
        }
    }, []);

    const clearFocus = useCallback(() => {
        if (focusedElement.current) {
            focusedElement.current.blur();
            focusedElement.current = null;
        }
    }, []);

    return { setFocus, clearFocus };
}

/**
 * Custom hook for batch updates
 */
export function useBatchedUpdates() {
    const updates = useRef([]);
    const timeoutRef = useRef(null);

    const batchUpdate = useCallback((updateFunction) => {
        updates.current.push(updateFunction);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            // Apply all batched updates
            updates.current.forEach(update => update());
            updates.current = [];
        }, 0);
    }, []);

    const flushUpdates = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        updates.current.forEach(update => update());
        updates.current = [];
    }, []);

    return { batchUpdate, flushUpdates };
}

/**
 * Custom hook for efficient data fetching with caching
 */
export function useCachedData(key, fetchFunction, options = {}) {
    const cache = useRef(new Map());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const {
        ttl = 5 * 60 * 1000, // 5 minutes default
        staleWhileRevalidate = true
    } = options;

    const fetchData = useCallback(async (forceRefresh = false) => {
        const cached = cache.current.get(key);
        const now = Date.now();

        // Return cached data if fresh
        if (!forceRefresh && cached && (now - cached.timestamp) < ttl) {
            setData(cached.data);
            return cached.data;
        }

        // Return stale data while revalidating
        if (staleWhileRevalidate && cached) {
            setData(cached.data);
        } else {
            setLoading(true);
        }

        try {
            const result = await fetchFunction();
            
            // Cache the result
            cache.current.set(key, {
                data: result,
                timestamp: now
            });

            setData(result);
            setError(null);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [key, fetchFunction, ttl, staleWhileRevalidate]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refetch: () => fetchData(true),
        clearCache: () => cache.current.delete(key)
    };
}
