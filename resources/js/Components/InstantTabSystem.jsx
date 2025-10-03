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
        { id: 'about', label: 'About', icon: '👤' },
        { id: 'wishes', label: 'Wishes', icon: '💝' },
        { id: 'memberships', label: 'Memberships', icon: '⭐' },
        { id: 'bills', label: 'Bills', icon: '💳' },
        { id: 'shop', label: 'Shop', icon: '🛍️' },
        { id: 'gifts', label: 'Gifts', icon: '🎁' }
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
                    relative py-2 px-0 border-b-2 text-normal md:text-lg uppercase 
                    transition-all duration-200 min-w-max whitespace-nowrap
                    select-none touch-manipulation
                    ${isEffectivelyActive 
                        ? 'border-pink-500 text-pink-600 font-semibold' 
                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                    }
                    ${shouldShowLoading ? 'opacity-90' : ''}
                    ${isClicked ? 'text-pink-700' : ''}
                    disabled:pointer-events-none
                `}
                aria-pressed={isEffectivelyActive}
                aria-label={`Switch to ${tab.label} tab`}
            >
                {/* Tab content */}
                <span className="flex items-center gap-2">
                    {/* <span className="text-lg" role="img" aria-hidden="true">
                        {tab.icon}
                    </span> */}
                    <span>{tab.label}</span>
                </span>
                
                {/* Loading indicator for pending tab */}
                {/* {shouldShowLoading && (
                    <div className="absolute -top-1 -right-1">
                        <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                    </div>
                )} */}
                
                {/* Click ripple effect */}
                {/* {isClicked && (
                    <div className="absolute inset-0 bg-pink-200 rounded opacity-30 animate-ping"></div>
                )} */}
            </button>
        );
    });

    return (
        <div className='relative'>
            <div className="newnav-tabs mb-4 pe-[100px] overflow-x-auto  flex items-center justify-between py-2 relative">
                {/* Tab buttons container */}
                <div className="flex   ps-1 scrollbar-hide space-x-8 min-w-max">
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
