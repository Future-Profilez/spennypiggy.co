import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Link, router } from '@inertiajs/react';

/**
 * Ultra-responsive tab system with instant visual feedback
 * Eliminates multiple clicks and provides 0ms response time
 */
function InstantTabSystem({ 
    activeTab, 
    user, 
    username, Toggle,
    IsloggedIn,
    onTabChange = null 
}) {
    // Client-side state for instant feedback
    const [pendingTab, setPendingTab] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [clickedTab, setClickedTab] = useState(null);
    
    // Debouncing and click management
    const lastClickTime = useRef(0);
    const navigationTimeout = useRef(null);
    const clickCount = useRef(new Map());
    
    // Performance tracking
    const performanceRef = useRef({
        clickTime: 0,
        feedbackTime: 0,
        navigationTime: 0
    });

    const tabs = [
        { id: 'about', label: 'About' },
        { id: 'wishes', label: 'Wishes' },
        { id: 'tasks', label: 'Tasks' },
        { id: 'memberships', label: 'Memberships' },
        { id: 'bills', label: 'Bills' },
    ];

    // Get effective active tab (including pending state)
    const effectiveActiveTab = pendingTab || activeTab;

    // Instant visual feedback on click
    const handleTabClick = useCallback((tabId, e) => {
        const clickTime = performance.now();
        performanceRef.current.clickTime = clickTime;
        
        // Prevent default to control navigation
        e.preventDefault();
        
        // Check for rapid clicks (debouncing)
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTime.current;
        
        // Count clicks for this tab
        const currentCount = clickCount.current.get(tabId) || 0;
        clickCount.current.set(tabId, currentCount + 1);
        
        // If same tab clicked multiple times quickly, ignore
        if (tabId === effectiveActiveTab && timeSinceLastClick < 300) {
            console.info('🚫 Duplicate click ignored:', tabId);
            return;
        }
        
        // If different tab clicked too quickly, ignore
        if (tabId !== effectiveActiveTab && timeSinceLastClick < 100) {
            console.info('🚫 Too rapid click ignored:', tabId, timeSinceLastClick + 'ms');
            return;
        }
        
        lastClickTime.current = now;
        
        // INSTANT visual feedback (within 1 frame)
        requestAnimationFrame(() => {
            const feedbackTime = performance.now();
            performanceRef.current.feedbackTime = feedbackTime - clickTime;
            
            // Set visual states immediately
            setPendingTab(tabId);
            setClickedTab(tabId);
            setIsTransitioning(true);
            
            console.info(`⚡ Instant feedback: ${Math.round(performanceRef.current.feedbackTime)}ms`);
        });
        
        // Haptic feedback on supported devices
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        
        // Clear clicked state after animation
        setTimeout(() => {
            setClickedTab(null);
        }, 150);
        
        // Call external handler if provided (for optimistic updates)
        if (onTabChange) {
            onTabChange(tabId);
        }
        
        // Clear previous navigation timeout
        if (navigationTimeout.current) {
            clearTimeout(navigationTimeout.current);
        }
        
        // Navigate with slight delay for smooth UX
        navigationTimeout.current = setTimeout(() => {
            const navigationStartTime = performance.now();
            
            // Use Inertia navigation with optimization flags
            router.visit(route('user.show', {
                username: user.username,
                page: tabId
            }), {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onStart: () => {
                    console.info(`🚀 Navigation started for: ${tabId}`);
                },
                onSuccess: () => {
                    performanceRef.current.navigationTime = performance.now() - navigationStartTime;
                    console.info(`✅ Navigation completed: ${Math.round(performanceRef.current.navigationTime)}ms`);
                    
                    // Reset states
                    setPendingTab(null);
                    setIsTransitioning(false);
                    
                    // Reset click count for this tab
                    clickCount.current.set(tabId, 0);
                },
                onError: (error) => {
                    console.error('❌ Navigation failed:', error);
                    
                    // Reset states on error
                    setPendingTab(null);
                    setIsTransitioning(false);
                }
            });
        }, 50); // 50ms delay for smooth visual feedback
        
    }, [effectiveActiveTab, user.username, onTabChange]);

    // Hover preloading (for Phase 2)
    const handleTabHover = useCallback((tabId) => {
        // Will implement preloading logic in Phase 2
        console.debug(`👀 Hover detected: ${tabId}`);
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (navigationTimeout.current) {
                clearTimeout(navigationTimeout.current);
            }
        };
    }, []);

    // Tab button component with instant feedback
    const TabButton = memo(({ tab, isActive, isPending, isClicked, isTransitioning }) => {
        const buttonRef = useRef(null);
        
        // Determine visual state
        const isEffectivelyActive = isActive || isPending;
        const shouldShowLoading = isPending && isTransitioning;
        
        // Dynamic styles for instant feedback
        const buttonStyles = {
            transform: isClicked ? 'scale(0.95)' : 'scale(1)',
            transition: isClicked ? 'transform 0.1s ease-out' : 'transform 0.2s ease-out',
            willChange: 'transform',
        };
        
        const handleClick = (e) => {
            handleTabClick(tab.id, e);
        };
        
        const handleMouseEnter = () => {
            handleTabHover(tab.id);
        };
        
        return (
            <button
                ref={buttonRef}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                style={buttonStyles}
                disabled={isTransitioning && isPending}
                className={`
                    relative py-4 px-0 text-normal font-black uppercase 
                    transition-all duration-300 min-w-max whitespace-nowrap
                    select-none touch-manipulation tracking-[0.2em]
                    ${isEffectivelyActive 
                        ? 'text-white' 
                        : 'text-white/70 hover:text-white/70'
                    }
                    ${shouldShowLoading ? 'opacity-90' : ''}
                    disabled:pointer-events-none
                `}
                aria-pressed={isEffectivelyActive}
                aria-label={`Switch to ${tab.label} tab`}
            >
                {/* Tab content */}
                <span className="flex items-center gap-2">
                    <span>{tab.label}</span>
                </span>
                
                {/* Gradient active indicator */}
                {isEffectivelyActive && (
                    <div className="absolute bottom-[2px] left-0 right-0 h-[3px] bg-gradient-to-r from-[#05EFB8] via-[#8C52FF] to-[#F94F97] rounded-t-full shadow-[0_-2px_10px_rgba(140,82,255,0.5)]"></div>
                )}
            </button>
        );
    });

    return (
        <div className='relative'>
            <div className=" newnav-tabs hideScroll mb-8 pe-[100px] overflow-x-auto flex items-center justify-between py-0 relative">
                <div className="flex ps-1 scrollbar-hide space-x-8 min-w-max">
                    {tabs.map((tab) => (
                        <TabButton
                            key={tab.id}
                            tab={tab}
                            isActive={activeTab === tab.id}
                            isPending={pendingTab === tab.id}
                            isClicked={clickedTab === tab.id}
                            isTransitioning={isTransitioning}
                        />
                    ))}
                </div>
                {isTransitioning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100 to-transparent opacity-20 animate-pulse pointer-events-none"></div>
                )}
            </div>
                {IsloggedIn && (
                        <Toggle />
                )}
        </div>
    );
}

export default memo(InstantTabSystem, (prevProps, nextProps) => {
    return (
        prevProps.activeTab === nextProps.activeTab &&
        prevProps.user?.id === nextProps.user?.id &&
        prevProps.IsloggedIn === nextProps.IsloggedIn
    );
});
