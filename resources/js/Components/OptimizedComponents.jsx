import { memo, Suspense, lazy, forwardRef, useCallback, useMemo, cloneElement, Component } from 'react';
import { useIntersectionObserver, useVirtualList } from '../hooks/usePerformanceOptimization';

/**
 * Memoized Button Component
 * Prevents unnecessary re-renders when props haven't changed
 */
export const MemoizedButton = memo(({ 
    onClick, 
    children, 
    className = '', 
    disabled = false,
    variant = 'primary',
    size = 'medium',
    ...props 
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-[30px]  font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = useMemo(() => ({
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
    }), []);

    const sizeClasses = useMemo(() => ({
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-4 py-2 text-sm',
        large: 'px-6 py-3 text-base'
    }), []);

    const buttonClasses = useMemo(() => [
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
    ].filter(Boolean).join(' '), [baseClasses, variantClasses, variant, sizeClasses, size, disabled, className]);

    return (
        <button
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
});

MemoizedButton.displayName = 'MemoizedButton';

/**
 * Lazy-loaded heavy components
 */
export const LazyChart = lazy(() => import('./Chart'));
export const LazyDataTable = lazy(() => import('./DataTable'));
export const LazyImageEditor = lazy(() => import('./ImageEditor'));
export const LazyVideoPlayer = lazy(() => import('./VideoPlayer'));

/**
 * Suspense wrapper with fallback
 */
export const SuspenseWrapper = memo(({ 
    children, 
    fallback = <div className="animate-pulse">Loading...</div> 
}) => (
    <Suspense fallback={fallback}>
        {children}
    </Suspense>
));

SuspenseWrapper.displayName = 'SuspenseWrapper';

/**
 * Optimized List Item Component
 */
const ListItem = memo(({ item, index, onClick, isSelected = false }) => {
    const handleClick = useCallback(() => {
        onClick?.(item, index);
    }, [onClick, item, index]);

    const itemClasses = useMemo(() => [
        'flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors',
        isSelected && 'bg-blue-50 border-blue-200'
    ].filter(Boolean).join(' '), [isSelected]);

    return (
        <div className={itemClasses} onClick={handleClick}>
            <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            {item.badge && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.badge}
                </span>
            )}
        </div>
    );
});

ListItem.displayName = 'ListItem';

/**
 * Virtualized List Component for large datasets
 */
export const VirtualizedList = memo(({ 
    items, 
    itemHeight = 80, 
    containerHeight = 400,
    onItemClick,
    selectedItems = new Set(),
    renderItem
}) => {
    const {
        visibleItems,
        totalHeight,
        offsetY,
        onScroll
    } = useVirtualList({
        items,
        itemHeight,
        containerHeight
    });

    const defaultRenderItem = useCallback((item, index) => (
        <ListItem
            key={item.id || index}
            item={item}
            index={index}
            onClick={onItemClick}
            isSelected={selectedItems.has(item.id)}
        />
    ), [onItemClick, selectedItems]);

    const itemRenderer = renderItem || defaultRenderItem;

    return (
        <div 
            className="overflow-auto border border-gray-200 rounded-[30px]  "
            style={{ height: containerHeight }}
            onScroll={onScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleItems.map((item, idx) => (
                        <div
                            key={item.id || item.index}
                            style={{ 
                                height: itemHeight,
                                position: 'relative'
                            }}
                        >
                            {itemRenderer(item, item.index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

VirtualizedList.displayName = 'VirtualizedList';

/**
 * Lazy Image Component with intersection observer
 */
export const LazyImage = memo(forwardRef(({ 
    src, 
    alt, 
    placeholder = '/images/placeholder.svg',
    className = '',
    ...props 
}, ref) => {
    const [imgRef, entry] = useIntersectionObserver({
        threshold: 0.1,
        freezeOnceVisible: true
    });

    const isVisible = !!entry?.isIntersecting;

    return (
        <div ref={imgRef} className={className}>
            <img
                ref={ref}
                src={isVisible ? src : placeholder}
                alt={alt}
                loading="lazy"
                decoding="async"
                {...props}
            />
        </div>
    );
}));

LazyImage.displayName = 'LazyImage';

/**
 * Optimized Card Component
 */
export const OptimizedCard = memo(({ 
    title, 
    content, 
    image, 
    actions,
    className = '',
    lazy = false 
}) => {
    const cardContent = useMemo(() => (
        <div className={`bg-white overflow-hidden shadow-sm rounded-[30px]   ${className}`}>
            {image && (
                <div className="aspect-w-16 aspect-h-9">
                    {lazy ? (
                        <LazyImage
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-48 object-cover"
                        />
                    ) : (
                        <img
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-48 object-cover"
                        />
                    )}
                </div>
            )}
            <div className="p-6">
                {title && (
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {title}
                    </h3>
                )}
                {content && (
                    <div className="text-gray-600 mb-4">
                        {content}
                    </div>
                )}
                {actions && (
                    <div className="flex space-x-2">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    ), [title, content, image, actions, className, lazy]);

    return cardContent;
});

OptimizedCard.displayName = 'OptimizedCard';

/**
 * Memoized Modal Component
 */
export const MemoizedModal = memo(({ 
    isOpen, 
    onClose, 
    title, 
    children,
    size = 'medium' 
}) => {
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const sizeClasses = useMemo(() => ({
        small: 'max-w-md',
        medium: 'max-w-lg',
        large: 'max-w-2xl',
        full: 'max-w-4xl'
    }), []);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
                onClick={handleOverlayClick}
            >
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                
                <div className={`inline-block align-bottom bg-white rounded-[30px]   text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} w-full`}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {title && (
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {title}
                                    </h3>
                                </div>
                            </div>
                        )}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
});

MemoizedModal.displayName = 'MemoizedModal';

/**
 * Optimized Form Field Component
 */
export const OptimizedFormField = memo(({ 
    label, 
    error, 
    children,
    required = false,
    className = '' 
}) => {
    const fieldId = useMemo(() => 
        `field-${Math.random().toString(36).substr(2, 9)}`, 
        []
    );

    return (
        <div className={`mb-4 ${className}`}>
            {label && (
                <label 
                    htmlFor={fieldId}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            {cloneElement(children, { id: fieldId })}
            {error && (
                <p className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
});

OptimizedFormField.displayName = 'OptimizedFormField';

/**
 * Loading Skeleton Component
 */
export const LoadingSkeleton = memo(({ 
    className = '', 
    rows = 1,
    avatar = false 
}) => (
    <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
            {avatar && (
                <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                </div>
            )}
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                </div>
            ))}
        </div>
    </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        
        // Log to error reporting service
        if (window.Sentry) {
            window.Sentry.captureException(error, {
                contexts: {
                    react: {
                        errorInfo
                    }
                }
            });
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 border border-red-200 rounded-[30px]   bg-red-50">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-red-600">
                        We're sorry, but something went wrong. Please try refreshing the page.
                    </p>
                    <button 
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
