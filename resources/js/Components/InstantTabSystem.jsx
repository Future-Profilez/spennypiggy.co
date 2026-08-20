import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Link, router } from '@inertiajs/react';
import { IoMdRefresh } from "react-icons/io";
import {
    ChevronLeft,
    ChevronRight,
    CircleUserRound,
    Sparkles,
    ShoppingBag,
    ClipboardList,
    PiggyBank,
    Crown,
    Repeat,
} from "lucide-react";

/**
 * One scroll step for the tab strip.
 *
 * ⚠️ BOTH ARROWS ARE ONE CONTROL AND ARE ONE SIZE — 44px, matching the refresh
 * button beside them and the minimum tap target. An earlier pair was 32px on the
 * left and 44px on the right, which read as a clipped fragment rather than a
 * button.
 *
 * ⚠️ `disabled`, never unmounted: see the note on `scrollByPage`. It also gives
 * a keyboard user something honest to land on rather than a control that
 * appears and disappears under them.
 */
function ScrollArrow({ direction, disabled, onClick }) {
    const isLeft = direction < 0;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={isLeft ? "Scroll tabs left" : "Scroll tabs right"}
            className={`
                hidden sm:flex h-11 w-11 shrink-0 items-center justify-center
                rounded-box-sm border-2 border-[#000] bg-white text-black
                transition-colors duration-200 hover:bg-yellow-100
                disabled:opacity-35 disabled:pointer-events-none
            `}
        >
            {isLeft ? (
                <ChevronLeft size={18} strokeWidth={3} />
            ) : (
                <ChevronRight size={18} strokeWidth={3} />
            )}
        </button>
    );
}


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

    // Overflow affordance. Seven tabs do not fit the profile column, and the
    // strip used to just clip the last one — which reads as a broken layout, not
    // as "there is more". Nothing here changes the strip's WIDTH: the arrows are
    // absolutely positioned over the fades, because showing a real arrow would
    // narrow the strip, which can stop it overflowing, which hides the arrow,
    // which makes it overflow again.
    const scrollRef = useRef(null);
    const [overflow, setOverflow] = useState({ left: false, right: false });

    /*
     * 🚨 THE ARROWS ARE LAID OUT BESIDE THE STRIP, NEVER OVER IT, AND THEY ARE
     * ALWAYS RENDERED. Two earlier attempts both failed for the same reason: an
     * arrow that only appears WHEN the strip overflows is caught in a loop —
     * showing it narrows the strip, which can stop the overflow, which hides it,
     * which widens the strip, which overflows again. Positioning them absolutely
     * escaped the loop but put the left button on top of the first tab, so
     * "WISHES" rendered as "ES".
     *
     * Reserving their space unconditionally breaks the loop outright: the strip
     * width no longer depends on whether it overflows. When there is nothing to
     * scroll the button is `disabled` and dimmed — a control that is visibly
     * unavailable, not a layout that moves.
     *
     * ⚠️ `hidden sm:flex`: a phone has no need for them (swipe) and 2×44px is
     * real width on a 360px screen. This is a desktop-mouse affordance, which is
     * the one input the strip could not otherwise serve.
     */
    const scrollByPage = useCallback((direction) => {
        const el = scrollRef.current;
        if (!el) return;

        // ~80% of a screenful, so the tab you were reading stays on screen and
        // becomes the anchor for where you are now.
        el.scrollBy({
            left: direction * Math.max(160, el.clientWidth * 0.8),
            behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")
                .matches
                ? "auto"
                : "smooth",
        });
    }, []);

    const measureOverflow = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        // 1px slack: sub-pixel widths otherwise leave a permanent phantom arrow.
        setOverflow({
            left: el.scrollLeft > 1,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
        });
    }, []);

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
            return;
        }
        
        // If different tab clicked too quickly, ignore
        if (tabId !== effectiveActiveTab && timeSinceLastClick < 100) {
            return;
        }
        
        lastClickTime.current = now;
        
        // INSTANT visual feedback (within 1 frame)
        requestAnimationFrame(() => {
            // Set visual states immediately
            setPendingTab(tabId);
            setClickedTab(tabId);
            setIsTransitioning(true);

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
            
            // Use Inertia navigation with optimization flags
            router.visit(route('user.show', {
                username: user.username,
                page: tabId
            }), {
                only: getOnlyPropsForTab(tabId),
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    
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
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (navigationTimeout.current) {
                clearTimeout(navigationTimeout.current);
            }
        };
    }, []);

    // Keep the arrows honest as the strip scrolls or the column resizes.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        measureOverflow();
        el.addEventListener('scroll', measureOverflow, { passive: true });

        const ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(measureOverflow)
            : null;
        ro?.observe(el);

        // ResizeObserver watches the CONTAINER, so a content-width change alone
        // never fires it — and the display face is a late-loading webfont. On
        // first paint the tabs measure with the fallback, fit, and the arrow is
        // never shown; the real font then lands and they overflow in silence.
        let cancelled = false;
        document.fonts?.ready
            .then(() => {
                if (!cancelled) measureOverflow();
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            el.removeEventListener('scroll', measureOverflow);
            ro?.disconnect();
        };
    }, [measureOverflow]);

    // A vertical wheel over the strip scrolls it sideways. This IS the
    // "scrolling is difficult" complaint: on a desktop mouse the only way to
    // move a horizontal strip is shift+wheel, which nobody discovers.
    // WARNING: registered natively with { passive: false } — React attaches
    // wheel listeners as passive, so preventDefault() from onWheel is ignored.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onWheel = (e) => {
            // Leave a genuine horizontal gesture (trackpad swipe) alone, and
            // never hijack the page's vertical scroll when nothing overflows.
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            if (el.scrollWidth <= el.clientWidth) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    // Land on the tab you are actually on. Reloading while on the last tab used
    // to leave the strip scrolled to the start with the current tab off-screen.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const current = el.querySelector('[aria-pressed="true"]');
        if (!current) return;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        current.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'nearest',
            inline: 'nearest',
        });
    }, [activeTab, pendingTab]);

    // Tab button component with instant feedback
    const TabButton = memo(({ tab, isActive, isPending, isClicked, isTransitioning }) => {
        const buttonRef = useRef(null);
        
        // Determine visual state
        const isEffectivelyActive = isActive || isPending;
        const shouldShowLoading = isPending && isTransitioning;
        
        // Instant tap feedback. Deliberately NOT a scale — no element on this
        // site grows on press; the press reads as a dip in opacity instead.
        const buttonStyles = {
            opacity: isClicked ? 0.7 : 1,
            transition: isClicked ? 'opacity 0.1s ease-out' : 'opacity 0.2s ease-out',
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
                    relative inline-flex items-center min-h-[44px] px-3.5 py-2 text-xs md:text-sm font-black uppercase
                    transition-colors duration-300 min-w-max whitespace-nowrap
                    select-none touch-manipulation tracking-wider border-2 border-black rounded-box-sm
                    ${isEffectivelyActive
                        ? 'text-black bg-yellow-300'
                        : 'text-black bg-white hover:bg-black/[0.04]'
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
                <ScrollArrow
                    direction={-1}
                    disabled={!overflow.left}
                    onClick={() => scrollByPage(-1)}
                />

                {/* min-w-0 + flex-1: without it the flex item refuses to shrink and the last
                    tabs get clipped off-screen instead of scrolling. */}
                <div className="relative min-w-0 flex-1">
                    <div
                        ref={scrollRef}
                        className="flex overflow-x-auto scrollbar-hide gap-2.5 px-0 py-1"
                    >
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

                    {/* The fade is the page's own mint, so the strip dissolves
                        into the page rather than ending in a hard cut — a clipped
                        tab reads as a bug, a fading one reads as "keep going".
                        pointer-events-none: it sits over real tabs. */}
                    {overflow.left && (
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#A2E4B8] to-transparent"
                        />
                    )}
                    {overflow.right && (
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#A2E4B8] to-transparent"
                        />
                    )}

                </div>

                <ScrollArrow
                    direction={1}
                    disabled={!overflow.right}
                    onClick={() => scrollByPage(1)}
                />
                {/* {isTransitioning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-100 to-white opacity-70 animate-pulse pointer-events-none"></div>
                )} */}
                {IsloggedIn && (
                    /* ⚠️ SPACE, NOT A RULE. This carried `border-l-2
                       border-black/10` — a 2px line at 10% opacity, which is
                       neither a line you can see nor an absence. The house order
                       for expressing depth is border weight, then border colour,
                       then space; a separator this quiet is doing the third job
                       with the first tool.

                       🚨 PLAIN `/* *\/`, NEVER `{/* *\/}` HERE. Inside a
                       parenthesised `&&`/ternary branch, braces are an OBJECT
                       LITERAL, not a JSX comment — it fails the whole Vite build
                       with `Expected ")" but found "className"`, and none of the
                       `npm run check` scanners catch it. */
                    <div className="pb-2 flex shrink-0 items-center gap-2 pl-2">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isTransitioning}
                            aria-label="Refresh this tab"
                            className={`
                                flex h-11 w-11 items-center justify-center
                                border-2 border-black rounded-box-sm
                                text-black bg-white hover:bg-black/[0.04]
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
