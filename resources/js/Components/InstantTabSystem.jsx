import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Link, router } from '@inertiajs/react';
import { IoMdRefresh } from "react-icons/io";
import {
    CircleUserRound,
    Sparkles,
    ShoppingBag,
    ClipboardList,
    PiggyBank,
    Crown,
    Repeat,
} from "lucide-react";

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
        { id: 'about', label: 'About', Icon: CircleUserRound },
        // { id: 'feed', label: 'Feed' },
        { id: 'wishes', label: 'Wishes', Icon: Sparkles },
        { id: 'shop', label: 'Shop', Icon: ShoppingBag },
        { id: 'tasks', label: 'Tasks', Icon: ClipboardList },
        { id: 'piggy-pots', label: 'Piggy Pots', Icon: PiggyBank },
        { id: 'memberships', label: 'Memberships', Icon: Crown },
        { id: 'bills', label: 'Bills', Icon: Repeat },
    ];

    // Get effective active tab (including pending state)
    const effectiveActiveTab = pendingTab || activeTab;

    const getOnlyPropsForTab = useCallback((tabId) => {
        const base = ['page', 'user', 'username', 'supporters', 'is_blocked', 'itemid'];

        switch (tabId) {
            case 'about':
                return [
                    ...base,
                    'posts',
                    'piggyPots',
                    'piggyPotTopSupporters',
                    'piggyPotFeed',
                    'sociallinks',
                    'slinks',
                    'intro',
                    'migration_status',
                    'card_capabilities',
                    'has_stripe_account',
                    'isNeedToUpgrade',
                    'stripe_requirements',
                    'first30DayEarnings',
                    'all_user_categories',
                ];
            case 'wishes':
                return [...base, 'items', 'wish_categories', 'selectedCategory', 'all_user_categories'];
            case 'tasks':
                return [...base, 'tasks', 'all_user_categories'];
            case 'shop':
                return [...base, 'shops', 'all_user_categories'];
            case 'memberships':
                return [...base, 'memberships', 'all_user_categories'];
            case 'bills':
                return [...base, 'bills', 'all_user_categories'];
            case 'piggy-pots':
                return [...base, 'piggyPots', 'all_user_categories'];
            default:
                return base;
        }
    }, []);

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
                only: getOnlyPropsForTab(tabId),
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
        
    }, [effectiveActiveTab, getOnlyPropsForTab, user.username, onTabChange]);

    const handleRefresh = useCallback((e) => {
        e.preventDefault();

        const tabId = effectiveActiveTab || 'about';
        setPendingTab(tabId);
        setIsTransitioning(true);

        router.visit(route('user.show', {
            username: user.username,
            page: tabId
        }), {
            data: { refresh: Date.now() },
            preserveScroll: true,
            preserveState: true,
            replace: true,
            onSuccess: () => {
                setPendingTab(null);
                setIsTransitioning(false);
            },
            onError: () => {
                setPendingTab(null);
                setIsTransitioning(false);
            },
        });
    }, [effectiveActiveTab, user.username]);

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
                    relative px-3.5 py-2 text-xs md:text-sm font-black uppercase
                    transition-all duration-300 min-w-max whitespace-nowrap
                    select-none touch-manipulation tracking-wider border-2 border-black rounded-box-sm
                    ${isEffectivelyActive
                        ? 'text-black bg-yellow-300'
                        : 'text-black bg-white hover:bg-yellow-100'
                    }
                    ${shouldShowLoading ? 'opacity-90 animate-pulse' : ''}
                    disabled:pointer-events-none
                `}
                aria-pressed={isEffectivelyActive}
                aria-label={`Switch to ${tab.label} tab`}
            >
                {/* Tab content */}
                <span className="flex items-center gap-1.5">
                    {tab.Icon ? <tab.Icon size={15} strokeWidth={2.5} className="shrink-0" /> : null}
                    <span>{tab.label}</span>
                </span>
            </button>
        );
    });

    return (
        <div className='relative pb-2 mt-4'>
            <div className="w-full flex items-center gap-3 py-2 relative">
                {/* min-w-0 + flex-1: without it the flex item refuses to shrink and the last
                    tabs get clipped off-screen instead of scrolling. */}
                <div className="flex min-w-0 flex-1 overflow-x-auto scrollbar-hide gap-2 pb-2 pt-1 px-0">
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
                {/* {isTransitioning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100 to-white opacity-70 animate-pulse pointer-events-none"></div>
                )} */}
                {IsloggedIn && (
                    <div className="pb-2 flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isTransitioning}
                            aria-label="Refresh this tab"
                            className={`
                                flex h-9 w-9 items-center justify-center
                                border-2 border-black rounded-box-sm
                                text-black bg-white hover:bg-yellow-100
                                disabled:opacity-70 disabled:pointer-events-none
                            `}
                        >
                            <IoMdRefresh size={18} />
                        </button>
                        <Toggle />
                    </div>
                )}
            </div>
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
