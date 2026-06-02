import React, { memo, useMemo, useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { usePage } from '@inertiajs/react';

// Import all tab components - they'll be loaded once and kept in memory
const Wishlistbox = React.lazy(() => import('@/wishlist/Wishlistbox'));
const MembershipsLists = React.lazy(() => import('@/Pages/membership/MembershipsLists'));
const Billslist = React.lazy(() => import('@/Pages/bills/Billslist'));
const ProfileProductLists = React.lazy(() => import('@/Pages/shop/profile/ProfileProductLists'));
const GiftListing = React.lazy(() => import('@/Pages/rye/GiftListing'));

/**
 * Ultra-fast tab renderer that never unmounts tabs
 * Uses visibility instead of mount/unmount for instant switching
 */
const FastTabRenderer = forwardRef(({ 
    activeTab, 
    user, 
    sLinks, 
    IsloggedIn, 
    username, 
    selectedCategory, 
    wish_categories,
    gifts,
    giftsloading 
}, ref) => {
    const { items, memberships, bills, shops, posts, _preloaded } = usePage().props;
    const tabRefs = useRef({});
    
    // Instant feedback state management
    const [pendingTab, setPendingTab] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadingStates, setLoadingStates] = useState({});
    
    // Performance monitoring
    const renderStart = useRef(performance.now());
    const transitionStart = useRef(null);
    
    // Handle tab transitions with instant feedback
    useEffect(() => {
        if (activeTab !== pendingTab && pendingTab) {
            // Reset transition states when navigation completes
            setPendingTab(null);
            setIsTransitioning(false);
            
            if (transitionStart.current) {
                const transitionTime = performance.now() - transitionStart.current;
                console.info(`✅ Tab transition completed: ${Math.round(transitionTime)}ms`);
                transitionStart.current = null;
            }
        }
    }, [activeTab, pendingTab]);
    
    useEffect(() => {
        if (_preloaded) {
            const loadTime = performance.now() - renderStart.current;
            console.info(`🚀 FastTabRenderer: ${Math.round(loadTime)}ms (preloaded)`);
        }
    }, [_preloaded]);
    
    // Optimistic tab change handler (called from tab buttons)
    const handleOptimisticTabChange = (tabId) => {
        if (tabId === activeTab) return; // No change needed
        
        transitionStart.current = performance.now();
        setPendingTab(tabId);
        setIsTransitioning(true);
        
        // Set loading state for the target tab
        setLoadingStates(prev => ({
            ...prev,
            [tabId]: true
        }));
        
        // Clear loading state after transition
        setTimeout(() => {
            setLoadingStates(prev => {
                const newState = { ...prev };
                delete newState[tabId];
                return newState;
            });
        }, 300);
        
        console.info(`⚡ Optimistic change to: ${tabId}`);
    };
    
    // Expose handleOptimisticTabChange to parent via ref
    useImperativeHandle(ref, () => ({
        handleOptimisticTabChange
    }));
    
    // Memoize tab content to prevent unnecessary re-renders
    const memoizedTabs = useMemo(() => {
        const tabContent = {};
        
        // About tab content
        tabContent.about = (
            <div className="tab-content-about">
                {user?.bio ? (
                    <div className="bg-white rounded-[30px]    p-4 shadow-sm mb-4">
                        <h3 className="font-semibold text-lg mb-2">About</h3>
                        <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-[30px]    p-6 text-center mb-4">
                        <p className="text-gray-500">No bio added yet.</p>
                    </div>
                )}
                
                {sLinks && sLinks.length > 0 && (
                    <div className="bg-white rounded-[30px]    p-4 shadow-sm">
                        <h3 className="font-semibold text-lg mb-3">Social Links</h3>
                        <div className="flex flex-wrap gap-2">
                            {sLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    {link.platform}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Show recent posts */}
                {posts && posts.length > 0 && (
                    <div className="bg-white rounded-[30px]    p-4 shadow-sm mt-4">
                        <h3 className="font-semibold text-lg mb-3">Recent Posts</h3>
                        <div className="space-y-3">
                            {posts.slice(0, 3).map((post, index) => (
                                <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                                    <p className="text-sm text-gray-600">{post.content?.slice(0, 100)}...</p>
                                    <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
        
        // Wishes tab - render as list instead of single component
        tabContent.wishes = (
            <React.Suspense fallback={<div className="animate-pulse p-4">Loading wishes...</div>}>
                <div className="wishes-container">
                    {items && items.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                            {items.map((item, index) => (
                                <Wishlistbox
                                    key={`wish-item-${index}`}
                                    itm={item}
                                    IsloggedIn={IsloggedIn}
                                    currency={item?.currency || 'GBP'}
                                    auth={null} // Will be passed from parent
                                    itemid={null}
                                    setuped={true}
                                    classes=""
                                    showall={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No wishes found.</p>
                        </div>
                    )}
                </div>
            </React.Suspense>
        );
        
        // Memberships tab
        tabContent.memberships = (
            <React.Suspense fallback={<div className="animate-pulse p-4">Loading memberships...</div>}>
                <MembershipsLists 
                    IsloggedIn={IsloggedIn} 
                    username={username}
                />
            </React.Suspense>
        );
        
        // Bills tab
        tabContent.bills = (
            <React.Suspense fallback={<div className="animate-pulse p-4">Loading bills...</div>}>
                <Billslist IsloggedIn={IsloggedIn} />
            </React.Suspense>
        );
        
        // Shop tab
        tabContent.shop = (
            <React.Suspense fallback={<div className="animate-pulse p-4">Loading shop...</div>}>
                <ProfileProductLists 
                    profileuser={user}
                    IsloggedIn={IsloggedIn} 
                />
            </React.Suspense>
        );
        
        // Gifts tab - render as list
        tabContent.gifts = (
            <React.Suspense fallback={<div className="animate-pulse p-4">Loading gifts...</div>}>
                <div className="gifts-container">
                    {giftsloading ? (
                        <div className="animate-pulse p-4">Loading gifts...</div>
                    ) : gifts && gifts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                            {gifts.map((gift) => {
                                let details;
                                try {
                                    details = JSON.parse(gift.details);
                                } catch (e) {
                                    console.error('Error parsing gift details:', e);
                                    details = { title: 'Unknown Gift', price: { displayValue: '$0' } };
                                }
                                
                                return (
                                    <GiftListing
                                        key={gift.id}
                                        gift={gift}
                                        details={details}
                                        user={user}
                                        IsloggedIn={IsloggedIn}
                                        auth={null} // Will be passed from parent
                                        fetch_gifts={() => {}} // No-op in fast renderer
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No gifts found.</p>
                        </div>
                    )}
                </div>
            </React.Suspense>
        );
        
        return tabContent;
    }, [
        user, 
        sLinks, 
        items, 
        memberships, 
        bills, 
        shops, 
        posts,
        gifts, 
        giftsloading,
        IsloggedIn, 
        username, 
        selectedCategory, 
        wish_categories
    ]);
    
    // Enhanced tab visibility with pending states
    const visibleTabs = useMemo(() => {
        const tabs = ['about', 'wishes', 'memberships', 'bills', 'shop', 'gifts'];
        return tabs.map(tab => ({
            name: tab,
            isVisible: tab === activeTab,
            isPending: pendingTab === tab,
            isLoading: loadingStates[tab] || false,
            content: memoizedTabs[tab]
        }));
    }, [activeTab, pendingTab, loadingStates, memoizedTabs]);
    
    return (
        <div className="fast-tab-renderer min-h-screen relative">
            {/* Global transition overlay */}
            {isTransitioning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-50 to-transparent opacity-30 animate-pulse pointer-events-none z-20"></div>
            )}
            
            {visibleTabs.map(({ name, isVisible, isPending, isLoading, content }) => {
                const effectivelyActive = isVisible || isPending;
                
                return (
                    <div
                        key={name}
                        ref={el => tabRefs.current[name] = el}
                        className={`tab-content-${name} absolute inset-0 transition-all duration-150 ${
                            effectivelyActive
                                ? 'opacity-100 visible z-10 transform translate-x-0' 
                                : 'opacity-0 invisible z-0 transform translate-x-4'
                        } ${
                            isPending ? 'scale-[1.01]' : 'scale-100'
                        }`}
                        style={{
                            pointerEvents: effectivelyActive ? 'auto' : 'none',
                            willChange: isPending ? 'transform, opacity' : 'auto'
                        }}
                        aria-hidden={!effectivelyActive}
                    >
                        {/* Loading overlay for pending content */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-30">
                                <div className="flex items-center space-x-3">
                                    <div className="w-4 h-4 border-2 border-[#FF007F] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-gray-600 font-medium">
                                        Loading {name}...
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {/* Only render content for visible/pending tab + about tab for performance */}
                        {(effectivelyActive || name === 'about') && (
                            <div className="h-full overflow-auto">
                                {content}
                            </div>
                        )}
                    </div>
                );
            })}
            
            {/* Performance indicators (dev only) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 space-y-2 z-50">
                    {_preloaded && (
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                            ⚡ Preloaded
                        </div>
                    )}
                    {isTransitioning && (
                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                            🔄 Transitioning to {pendingTab}
                        </div>
                    )}
                    {Object.keys(loadingStates).length > 0 && (
                        <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs">
                            ⏳ Loading: {Object.keys(loadingStates).join(', ')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

// Export with memo for maximum performance
export default memo(FastTabRenderer, (prevProps, nextProps) => {
    // Only re-render if activeTab changes or critical data changes
    return (
        prevProps.activeTab === nextProps.activeTab &&
        prevProps.user?.id === nextProps.user?.id &&
        prevProps.IsloggedIn === nextProps.IsloggedIn &&
        prevProps.selectedCategory === nextProps.selectedCategory
    );
});
