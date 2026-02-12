import React, { Suspense } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';

// Import the individual Wishlistbox component
const Wishlistbox = React.lazy(() => import('@/wishlist/Wishlistbox'));

/**
 * WishlistGrid - Properly maps over wishitems array and renders individual Wishlistbox components
 * This fixes the hydration mismatch issue where TabContent was passing array to single-item component
 */
export default function WishlistGrid({ 
    wishitems, 
    IsloggedIn, 
    username, 
    selectedCategory, 
    wish_categories,
    currency,
    auth,
    itemid,
    setuped 
}) {
    // Early return if no items to prevent empty grid
    if (!wishitems || !Array.isArray(wishitems) || wishitems.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No wishes found.</p>
            </div>
        );
    }

    return (
        <div className="wishes-container">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 !gap-2 sm:!gap-3 md:!gap-4">
                {wishitems.map((item, index) => (
                    <Suspense key={`wish-${item.id || item.uuid || index}`} fallback={<div className="animate-pulse bg-gray-200 h-40 rounded-[40px]  " />}>
                        <Wishlistbox
                            // Use stable key based on item.id or uuid, fallback to index
                            key={`wish-item-${item.id || item.uuid || index}`}
                            classes=" "
                            currency={currency || item?.currency || 'GBP'}
                            IsloggedIn={IsloggedIn}
                            auth={auth}
                            itemid={itemid}
                            setuped={setuped}
                            itm={item}  // ✅ CORRECT: Pass single item as 'itm'
                            showall={true}
                        />
                    </Suspense>
                ))}
            </div>
        </div>
    );
}