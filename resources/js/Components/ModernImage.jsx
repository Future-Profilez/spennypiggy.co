import { useState, useEffect, useRef } from "react";

const ModernImage = ({
    src,
    alt = '',
    className = '',
    loading = 'lazy',
    decoding = 'async',
    priority = false,
    responsive = true,
    formats = ['webp', 'avif'],
    quality = 85,
    sizes = null,
    width = null,
    height = null,
    onLoad = null,
    onError = null,
    fallback = null,
    aspectRatio = null,
    objectFit = 'cover',
    placeholder = 'blur',
    blurDataURL = null,
    breakpoints = null,
    preventCLS = true,
    reserveSpace = true,
    fetchPriority: _ignoredFetchPriority, // Destructure to prevent passing to DOM
    ...props
}) => {
    const [imageData, setImageData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isInView, setIsInView] = useState(priority || loading === 'eager');
    const imgRef = useRef(null);

    // Default responsive sizes for different breakpoints
    const defaultSizes = sizes || breakpoints ? 
        generateSizesFromBreakpoints(breakpoints) :
        '(max-width: 320px) 300px, (max-width: 640px) 600px, (max-width: 768px) 720px, (max-width: 1024px) 960px, (max-width: 1280px) 1200px, 100vw';

    const responsiveSizes = [320, 640, 768, 1024, 1280, 1920];

    // Intersection Observer for lazy loading
    useEffect(() => {
        if (priority || loading === 'eager') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { 
                rootMargin: '50px',
                threshold: 0.01
            }
        );

        const currentRef = imgRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [priority, loading]);

    // Process image data for modern formats and responsive sizes
    useEffect(() => {
        if (!src || !isInView) return;

        const processImageData = () => {
            const data = {
                original: src,
                formats: {},
                responsive: {}
            };

            // Handle Uploadcare CDN URLs
            if (src.includes('ucarecdn.com')) {
                // Extract the base UUID from the URL
                const urlParts = src.split('/');
                const uuidIndex = urlParts.findIndex(part => part.includes('ucarecdn.com')) + 1;
                const uuid = urlParts[uuidIndex];
                const baseUrl = `https://ucarecdn.com/${uuid}`;
                
                // Generate format variations (remove quality as it causes 400 errors)
                if (formats.includes('webp')) {
                    data.formats.webp = `${baseUrl}/-/format/webp/`;
                }
                if (formats.includes('avif')) {
                    data.formats.avif = `${baseUrl}/-/format/avif/`;
                }

                // Generate responsive sizes for each format
                if (responsive) {
                    ['original', 'webp', 'avif'].forEach(format => {
                        if (format === 'original' || data.formats[format]) {
                            data.responsive[format] = {};
                            
                            responsiveSizes.forEach(size => {
                                if (format === 'original') {
                                    // For original, use jpeg format with resize (no quality to avoid 400 errors)
                                    data.responsive[format][size] = `${baseUrl}/-/resize/${size}x/-/format/jpeg/`;
                                } else {
                                    // For other formats, construct URL with resize + format (no quality)
                                    const formatType = format === 'webp' ? 'webp' : 'avif';
                                    data.responsive[format][size] = `${baseUrl}/-/resize/${size}x/-/format/${formatType}/`;
                                }
                            });
                        }
                    });
                }
            }
            
            setImageData(data);
        };

        processImageData();
    }, [src, isInView, responsive, formats, quality]);

    const generateSrcSet = (responsiveImages) => {
        if (!responsiveImages) return '';
        
        return Object.entries(responsiveImages)
            .map(([width, url]) => `${url} ${width}w`)
            .join(', ');
    };

    const generateSizesFromBreakpoints = (breakpoints) => {
        if (!breakpoints) return null;
        
        const sizesParts = Object.entries(breakpoints).map(([mediaQuery, size]) => 
            `${mediaQuery} ${size}`
        );
        sizesParts.push('100vw');
        
        return sizesParts.join(', ');
    };

    const handleImageLoad = (e) => {
        setIsLoading(false);
        if (onLoad) onLoad(e);
    };

    const handleImageError = (e) => {
        setError(true);
        setIsLoading(false);
        if (onError) onError(e);
    };

    // Don't render anything if not in view and lazy loading
    if (!isInView && loading === 'lazy') {
        return (
            <div 
                ref={imgRef}
                className={`${className} bg-gray-200 animate-pulse`}
                style={{
                    width: width || '100%',
                    height: height || (aspectRatio ? 'auto' : '200px'),
                    aspectRatio: aspectRatio || 'auto'
                }}
                aria-label={`Loading ${alt}`}
            />
        );
    }

    // Show error state
    if (error && fallback) {
        return fallback;
    }

    // Determine loading and priority attributes
    const loadingAttr = priority ? 'eager' : loading;
    const fetchPriority = priority ? 'high' : 'auto';

    // Container style for aspect ratio
    const containerStyle = {
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: aspectRatio || 'auto',
        overflow: 'hidden'
    };

    const imageStyle = {
        objectFit,
        width: '100%',
        height: '100%',
        transition: isLoading ? 'opacity 0.3s ease' : 'none',
        opacity: isLoading ? 0 : 1,
        ...props.style
    };

    // Render picture element with modern formats
    if (imageData && responsive && (imageData.responsive.webp || imageData.responsive.avif || imageData.responsive.original)) {
        return (
            <div style={containerStyle} className="relative">
                {/* Loading placeholder */}
                {isLoading && placeholder === 'blur' && (
                    <div 
                        className={`absolute inset-0 ${blurDataURL ? '' : 'bg-gray-200 animate-pulse'}`}
                        style={blurDataURL ? {
                            backgroundImage: `url(${blurDataURL})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(5px)',
                            transform: 'scale(1.1)'
                        } : {}}
                    />
                )}
                
                <picture className="block w-full h-full">
                    {/* AVIF source (most efficient) */}
                    {imageData.responsive.avif && (
                        <source
                            srcSet={generateSrcSet(imageData.responsive.avif)}
                            sizes={defaultSizes}
                            type="image/avif"
                        />
                    )}
                    
                    {/* WebP source (good compatibility) */}
                    {imageData.responsive.webp && (
                        <source
                            srcSet={generateSrcSet(imageData.responsive.webp)}
                            sizes={defaultSizes}
                            type="image/webp"
                        />
                    )}
                    
                    {/* Original format fallback */}
                    <img
                        ref={imgRef}
                        src={imageData.original}
                        srcSet={imageData.responsive.original ? generateSrcSet(imageData.responsive.original) : undefined}
                        sizes={imageData.responsive.original ? defaultSizes : undefined}
                        alt={alt}
                        loading={loadingAttr}
                        decoding={decoding}
                        fetchpriority={fetchPriority}
                        className={className}
                        width={width}
                        height={height}
                        style={imageStyle}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        {...props}
                    />
                </picture>
            </div>
        );
    }

    // Fallback simple img tag
    return (
        <div style={containerStyle} className="relative">
            {/* Loading placeholder */}
            {isLoading && placeholder === 'blur' && (
                <div 
                    className={`absolute inset-0 ${blurDataURL ? '' : 'bg-gray-200 animate-pulse'}`}
                    style={blurDataURL ? {
                        backgroundImage: `url(${blurDataURL})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(5px)',
                        transform: 'scale(1.1)'
                    } : {}}
                />
            )}
            
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={loadingAttr}
                decoding={decoding}
                fetchpriority={fetchPriority}
                className={className}
                width={width}
                height={height}
                style={imageStyle}
                onLoad={handleImageLoad}
                onError={handleImageError}
                {...props}
            />
        </div>
    );
};

// Hook for checking browser support
export const useBrowserSupport = () => {
    const [support, setSupport] = useState({
        webp: false,
        avif: false
    });

    useEffect(() => {
        const checkSupport = async () => {
            const webpSupport = await checkWebPSupport();
            const avifSupport = await checkAVIFSupport();
            
            setSupport({
                webp: webpSupport,
                avif: avifSupport
            });
        };

        checkSupport();
    }, []);

    return support;
};

// Check WebP support
const checkWebPSupport = () => {
    return new Promise((resolve) => {
        const webp = new Image();
        webp.onload = webp.onerror = () => {
            resolve(webp.height === 2);
        };
        webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
};

// Check AVIF support
const checkAVIFSupport = () => {
    return new Promise((resolve) => {
        const avif = new Image();
        avif.onload = avif.onerror = () => {
            resolve(avif.height === 2);
        };
        avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
};

export default ModernImage;
