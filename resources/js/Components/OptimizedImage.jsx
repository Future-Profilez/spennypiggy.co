import React, { useState, useRef, useEffect, memo } from 'react';

/**
 * Optimized Image Component with:
 * - Lazy loading with Intersection Observer
 * - WebP format support with fallbacks
 * - Proper sizing and aspect ratios
 * - Loading placeholders
 * - Performance monitoring
 */
function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = '',
    priority = false,
    sizes = '100vw',
    quality = 85,
    placeholder = 'blur',
    onLoad,
    onError,
    ...props
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [error, setError] = useState(false);
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    // Convert src to optimized URLs
    const getOptimizedSrc = (originalSrc, format = 'auto') => {
        if (!originalSrc) return null;
        
        // If it's an Uploadcare URL, optimize it
        if (originalSrc.includes('ucarecdn.com')) {
            const baseUrl = originalSrc.split('/-/')[0];
            return `${baseUrl}/-/format/${format}/-/quality/${quality}/-/resize/${width}x${height}/`;
        }
        
        // If it's a local build asset, return as-is
        if (originalSrc.includes('/build/')) {
            return originalSrc;
        }
        
        // For other URLs, return as-is (could be enhanced)
        return originalSrc;
    };

    // Generate srcSet for different formats and sizes
    const generateSrcSet = () => {
        if (!src || error) return '';
        
        const sizes = [
            { w: Math.floor(width * 0.5), suffix: '0.5x' },
            { w: width, suffix: '1x' },
            { w: Math.floor(width * 1.5), suffix: '1.5x' },
            { w: Math.floor(width * 2), suffix: '2x' },
        ];
        
        return sizes.map(({ w, suffix }) => {
            const optimizedSrc = getOptimizedSrc(src).replace(`${width}x${height}`, `${w}x${Math.floor(height * (w / width))}`);
            return `${optimizedSrc} ${suffix}`;
        }).join(', ');
    };

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || !imgRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observerRef.current.unobserve(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: 0.01,
            }
        );

        observerRef.current.observe(imgRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [priority]);

    // Handle image load
    const handleLoad = (e) => {
        setIsLoaded(true);
        setError(false);
        
        // Performance tracking
        if (process.env.NODE_ENV === 'development') {
            const loadTime = performance.now() - (e.target.dataset.startTime || 0);
            console.info(`🖼️ Image loaded: ${src} (${Math.round(loadTime)}ms)`);
        }
        
        onLoad?.(e);
    };

    // Handle image error
    const handleError = (e) => {
        setError(true);
        console.warn(`❌ Image failed to load: ${src}`);
        onError?.(e);
    };

    // Placeholder component
    const Placeholder = () => (
        <div
            className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
            style={{ width, height }}
        >
            <svg
                className="w-8 h-8 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                />
            </svg>
        </div>
    );

    // Error fallback
    if (error) {
        return (
            <div
                className={`bg-gray-100 flex items-center justify-center border border-gray-300 ${className}`}
                style={{ width, height }}
            >
                <span className="text-gray-500 text-sm">Image unavailable</span>
            </div>
        );
    }

    // Don't render anything until in view (unless priority)
    if (!isInView) {
        return (
            <div
                ref={imgRef}
                className={`bg-gray-200 ${className}`}
                style={{ width, height }}
            />
        );
    }

    const webpSrc = getOptimizedSrc(src, 'webp');
    const fallbackSrc = getOptimizedSrc(src, 'auto');

    return (
        <div className={`relative ${className}`} style={{ width, height }}>
            {/* Show placeholder while loading */}
            {!isLoaded && <Placeholder />}
            
            {/* Optimized picture element with WebP support */}
            <picture className={isLoaded ? 'opacity-100' : 'opacity-0'}>
                {/* WebP version for supported browsers */}
                <source
                    type="image/webp"
                    src={webpSrc}
                    srcSet={generateSrcSet()}
                    sizes={sizes}
                />
                
                {/* Fallback for other browsers */}
                <img
                    ref={imgRef}
                    src={fallbackSrc}
                    srcSet={generateSrcSet()}
                    sizes={sizes}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={handleLoad}
                    onError={handleError}
                    data-start-time={performance.now()}
                    className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        position: isLoaded ? 'relative' : 'absolute',
                        top: 0,
                        left: 0,
                    }}
                    {...props}
                />
            </picture>
            
            {/* Performance indicator (dev only) */}
            {process.env.NODE_ENV === 'development' && isLoaded && (
                <div className="absolute top-1 right-1 bg-green-400 text-white px-1 text-xs rounded opacity-75">
                    ✓
                </div>
            )}
        </div>
    );
}

// Memoized export
export default memo(OptimizedImage, (prevProps, nextProps) => {
    return (
        prevProps.src === nextProps.src &&
        prevProps.width === nextProps.width &&
        prevProps.height === nextProps.height &&
        prevProps.priority === nextProps.priority
    );
});

// Preset components for common use cases
export const ProfileAvatar = memo(({ src, alt, size = 120, className = '', ...props }) => (
    <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full ${className}`}
        priority={true}
        quality={90}
        {...props}
    />
));

export const CoverImage = memo(({ src, alt, className = '', ...props }) => (
    <OptimizedImage
        src={src}
        alt={alt}
        width={1200}
        height={400}
        className={`rounded-[40px]  ${className}`}
        priority={true}
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
        {...props}
    />
));

export const ProductImage = memo(({ src, alt, className = '', ...props }) => (
    <OptimizedImage
        src={src}
        alt={alt}
        width={300}
        height={300}
        className={`rounded-[40px]   ${className}`}
        priority={false}
        quality={80}
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
        {...props}
    />
));
