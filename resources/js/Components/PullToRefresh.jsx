import { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';

export default function PullToRefresh() {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isPWA = useRef(false);
    const pullThreshold = Math.min(window.innerHeight * 0.15, 80); // 15% of screen height, max 80px
    const maxPullDistance = Math.min(window.innerHeight * 0.25, 120); // 25% of screen height, max 120px

    useEffect(() => {
        // Check if running as PWA
        isPWA.current = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');

        // Only add event listeners if in PWA mode
        if (!isPWA.current) {
            return;
        }

        const handleTouchStart = (e) => {
            // Only trigger if we're at the top of the page and not already refreshing
            if (window.scrollY > 0 || isRefreshing) return;
            
            startY.current = e.touches[0].clientY;
            currentY.current = startY.current;
            setIsPulling(false);
            setPullDistance(0);
        };

        const handleTouchMove = (e) => {
            // Only trigger if we're at the top of the page and not refreshing
            if (window.scrollY > 0 || isRefreshing) return;
            
            currentY.current = e.touches[0].clientY;
            const pullDist = Math.max(0, currentY.current - startY.current);
            
            if (pullDist > 5) { // Reduced threshold for better responsiveness
                e.preventDefault(); // Prevent default scroll behavior
                setIsPulling(true);
                setPullDistance(Math.min(pullDist, maxPullDistance));
            } else if (pullDist <= 0) {
                // Reset if user scrolls up
                setIsPulling(false);
                setPullDistance(0);
            }
        };

        const handleTouchEnd = () => {
            if (isRefreshing) return;
            
            if (isPulling && pullDistance >= pullThreshold) {
                // Trigger refresh
                setIsRefreshing(true);
                
                // Reload the current page using Inertia
                router.reload({
                    onFinish: () => {
                        setTimeout(() => {
                            setIsRefreshing(false);
                            setIsPulling(false);
                            setPullDistance(0);
                        }, 800); // Slightly longer delay for better UX
                    },
                    onError: () => {
                        // Handle errors gracefully
                        setTimeout(() => {
                            setIsRefreshing(false);
                            setIsPulling(false);
                            setPullDistance(0);
                        }, 500);
                    }
                });
            } else {
                // Reset if not pulled enough or not pulling
                setIsPulling(false);
                setPullDistance(0);
            }
        };

        // Add event listeners
        document.addEventListener('touchstart', handleTouchStart, { passive: false });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, pullDistance, isRefreshing]);

    // Don't render anything if not in PWA mode
    if (!isPWA.current) {
        return null;
    }

    return (
        <div 
            className={`pull-to-refresh-indicator ${
                isPulling || isRefreshing ? 'visible' : 'hidden'
            }`}
            style={{
                position: 'fixed',
                top: 0,
                left: '50%',
                transform: `translateX(-50%) translateY(${
                    isPulling ? Math.min(pullDistance - 20, 60) : isRefreshing ? 40 : -60
                }px)`,
                zIndex: 9999,
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '10px 20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: isRefreshing ? 'transform 0.3s ease' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
        >
            <div 
                className={`refresh-spinner ${
                    isRefreshing ? 'spinning' : ''
                }`}
                style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #e0e0e0',
                    borderTop: '2px solid #ff69b4',
                    borderRadius: '50%',
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                }}
            />
            <span>
                {isRefreshing 
                    ? 'Refreshing...' 
                    : pullDistance >= pullThreshold 
                        ? 'Release to refresh' 
                        : 'Pull to refresh'
                }
            </span>
            
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .pull-to-refresh-indicator.visible {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                .pull-to-refresh-indicator.hidden {
                    opacity: 0;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}