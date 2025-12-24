import { Link, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import DeviceID from '@/includes/DeviceID';
import { RiLayoutGridFill, RiUserHeartLine, RiGiftLine, RiCloseLine, RiFireLine, RiCheckDoubleLine, RiSearchLine, RiFileList3Line, RiVipCrownLine } from 'react-icons/ri';
import Popup from '@/Components/Popup';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import Avatar from '../../../includes/Avatar';
import CreatorCard from './CreatorCard';
import { trackSearchClick } from "@/includes/Analytics";

export default function ResultsGrid({auth, global_currency, results, mode, setMode, totalCount, activeFilters, removeFilter, onLoadMore }) {
    const renderedItems = useMemo(() => {
        const items = [];
        (results || []).forEach((item, index) => {
            let card;
            switch(mode) {
                case 'creator':
                    card = <CreatorCard item={item} />;
                    break;
                case 'wish':
                    card =  <Wishlistbox
                                key={`wish-item-${item.id}`}
                                classes=""
                                imagesize="max-h-[150px]"
                                currency={global_currency}
                                IsloggedIn={false}
                                auth={auth?.user}
                                itemid={item?.id}
                                // setuped={AuthUserStripeConnected ==1? true: false}
                                itm={item}
                                trackClick={true}
                            />;
                    break;
                case 'bill':
                    card = <BillGridCard item={item} />;
                    break;
                case 'membership':
                    card = <MembershipGridCard item={item} />;
                    break;
                default:
                    card = <WishGridCard item={item} />;
            }

            items.push(
                <div key={item.id} className="h-full">
                    {card}
                </div>
            );
            
            if ((index + 1) % 12 === 0 && index !== results.length - 1) {
                items.push(
                    <div key={`spotlight-${index}`} className="col-span-full my-8">
                        <SpotlightSection index={(index + 1) / 12} />
                    </div>
                );
            }
        });
        
        if (items.length === 0) {
             return (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                     <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6">
                        <RiSearchLine className="text-4xl text-pink-500" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">No matches found</h3>
                     <p className="text-gray-500 max-w-md mb-8">
                        We couldn't find any items matching your current filters. Try adjusting your search or filters.
                     </p>
                     <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                     >
                        Clear All Filters
                     </button>
                 </div>
             )
        }
        
        return items;
    }, [results, mode]);

    return (
        <div className="mt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(activeFilters).map(([key, value]) => {
                            if (Array.isArray(value)) {
                                return value.map(v => (
                                    <Chip key={`${key}-${v}`} label={v} onRemove={() => removeFilter(key, v)} />
                                ));
                            }
                            if (typeof value === 'boolean' && value) {
                                return <Chip key={key} label="Verified Only" onRemove={() => removeFilter(key, false)} />;
                            }
                            if (key.includes('Price') && value) {
                                return null; 
                            }
                            return null;
                    })}
                </div>
            </div>

            {/* Block 5: Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {renderedItems}
            </div>
            
            {/* Load More / Pagination */}
            <div className="mt-6 text-center">
                <button 
                    onClick={onLoadMore}
                    className="p-2 px-3 mb-6 text-gray-700 font-medium rounded-full hover:bg-gray-200 transition-colors" > Load More Results
                </button>
            </div>
        </div>
    );
}

function Chip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">
            {label}
            <button onClick={onRemove} className="ml-2 hover:text-pink-900">
                <RiCloseLine />
            </button>
        </span>
    );
}
 

const WishGridCard = React.memo(function WishGridCard({ item }) {
    const imageUrl = item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `https://ucarecdn.com/${item.image_url}/-/preview/`) : 'https://via.placeholder.com/400';
    const profileUrl = item.user ? route('user.show', item.user.username) : '#';
    
    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const deviceId = DeviceID();
        if (!deviceId) {
            console.error("Could not generate device ID");
            return;
        }

        router.get(route('add-to-cart', { 
            uuid: item.uuid, 
            device_id: deviceId, 
            sub: 'onetime' 
        }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Could trigger a global cart update event or toast here if needed
            }
        });
    };
    
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group relative">
            {/* Full Card Link */}
            <Link href={profileUrl} className="absolute inset-0 z-0" />

            <div className="block relative aspect-[4/3] bg-gray-100 overflow-hidden z-10 pointer-events-none">
                <img 
                    src={imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold text-gray-900 shadow-sm">
                    £{item.amount}
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-white">
                    {item.type || 'Wish'}
                </div>
            </div>

            <div className="p-4 flex flex-col flex-grow z-10 relative pointer-events-none">
                <div className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                    {item.title}
                </div>
                
                <div className="flex items-center gap-2 mb-4 pointer-events-auto">
                     {item.user && (
                        <Link href={profileUrl} onClick={() => item.user && trackSearchClick(item.user.id, item.user.username)} className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-20">
                             <img 
                                src={item.user.avatar_url || 'https://via.placeholder.com/30'}  
                                alt={item.user.name}
                                className="w-5 h-5 rounded-full object-cover"
                                loading="lazy"
                                decoding="async"
                             />
                             <span className="text-xs text-gray-500 truncate">by @{item.user.username}</span>
                        </Link>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2 pointer-events-auto">
                     <button 
                        onClick={handleAddToCart}
                        className="flex-1 py-2 text-sm font-bold text-white bg-pink-600 rounded-xl hover:bg-pink-700 shadow-md transform active:scale-95 transition-all relative z-20"
                    >
                        Send Gift
                    </button>
                </div>
            </div>
        </div>
    );
});

const BillGridCard = React.memo(function BillGridCard({ item }) {
    const imageUrl = item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `https://ucarecdn.com/${item.image_url}/-/preview/`) : 'https://via.placeholder.com/400';
    const profileUrl = item.user ? route('user.show', item.user.username) : '#';
    
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group relative">
            <Link href={profileUrl} onClick={() => item.user && trackSearchClick(item.user.id, item.user.username)} className="absolute inset-0 z-0" />

            <div className="block relative aspect-[4/3] bg-gray-100 overflow-hidden z-10 pointer-events-none">
                <img 
                    src={imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold text-gray-900 shadow-sm">
                   Bill
                </div>
            </div>

            <div className="p-4 flex flex-col flex-grow z-10 relative pointer-events-none">
                <div className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                    {item.title}
                </div>
                
                <div className="flex items-center gap-2 mb-4 pointer-events-auto">
                     {item.user && (
                        <Link href={profileUrl} onClick={() => item.user && trackSearchClick(item.user.id, item.user.username)} className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-20">
                             <img 
                                src={item.user.avatar_url || 'https://via.placeholder.com/30'} 
                                alt={item.user.name}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-xs text-gray-500 truncate">by @{item.user.username}</span>
                        </Link>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2 pointer-events-auto">
                        <Link href={profileUrl} onClick={() => item.user && trackSearchClick(item.user.id, item.user.username)}
                            className="flex-1 py-2 text-sm font-bold text-center text-white bg-pink-600 rounded-xl hover:bg-pink-700 shadow-md transform active:scale-95 transition-all relative z-20"
                        >
                            Support Bill
                        </Link>
                    </div>
            </div>
        </div>
    );
});

const MembershipGridCard = React.memo(function MembershipGridCard({ item }) {
    const imageUrl = item.image_url ? (item.image_url.startsWith('http') ? item.image_url : `https://ucarecdn.com/${item.image_url}/-/preview/`) : 'https://via.placeholder.com/400';
    const profileUrl = item.user ? route('user.show', item.user.username) : '#';
    
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col group relative">
            <Link href={profileUrl} className="absolute inset-0 z-0" />

            <div className="block relative aspect-[4/3] bg-gray-100 overflow-hidden z-10 pointer-events-none">
                <img 
                    src={imageUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold text-gray-900 shadow-sm">
                   Membership
                </div>
            </div>

            <div className="p-4 flex flex-col flex-grow z-10 relative pointer-events-none">
                <div className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                    {item.title}
                </div>
                
                <div className="flex items-center gap-2 mb-4 pointer-events-auto">
                     {item.user && (
                        <Link href={profileUrl} onClick={() => item.user && trackSearchClick(item.user.id, item.user.username)} className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-20">
                             <img 
                                src={item.user.avatar_url || 'https://via.placeholder.com/30'} 
                                alt={item.user.name}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-xs text-gray-500 truncate">by @{item.user.username}</span>
                        </Link>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2 pointer-events-auto">
                        <Link href={profileUrl} onClick={() => item.user && trackSearchClick(item.user.id, item.user.username)}
                            className="flex-1 py-2 text-sm font-bold text-center text-white bg-pink-600 rounded-xl hover:bg-pink-700 shadow-md transform active:scale-95 transition-all relative z-20"
                        >
                            Join Now
                        </Link>
                    </div>
            </div>
        </div>
    );
});

function SpotlightSection({ index }) {
    const spotlights = [
        { title: "Ending Soon ⏳", subtitle: "Wishes expiring in 24h", color: "bg-orange-50 border-orange-100" },
        { title: "Trending Now 🔥", subtitle: "Popular creators and wishes", color: "bg-pink-50 border-pink-100" },
        { title: "Quick Wins ⚡", subtitle: "Wishes under £20", color: "bg-green-50 border-green-100" },
    ];
    const spot = spotlights[index % spotlights.length];

    return (
        <div className={`rounded-2xl border p-6 ${spot.color} flex flex-col md:flex-row items-center justify-between gap-6`}>
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{spot.title}</h3>
                <p className="text-gray-600">{spot.subtitle}</p>
            </div>
            {spot.title === "Trending Now 🔥" ? (
                <Link href={route('discover', { type: 'trending', page: 1 })} className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                    View Collection
                </Link>
            ) : spot.title === "Quick Wins ⚡" ? (
                <Link href={route('discover', { search: 'under 20', page: 1 })} className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                    View Collection
                </Link>
            ) : (
                <Link href={route('discover', { search: 'expiring', page: 1 })} className="px-6 py-3 bg-white text-gray-900 font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                    View Collection
                </Link>
            )}
        </div>
    );
}
