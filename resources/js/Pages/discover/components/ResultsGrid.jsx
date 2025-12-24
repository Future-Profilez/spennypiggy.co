import { Link, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import DeviceID from '@/includes/DeviceID';
import { RiLayoutGridFill, RiUserHeartLine, RiGiftLine, RiCloseLine, RiFireLine, RiCheckDoubleLine, RiSearchLine, RiFileList3Line, RiVipCrownLine } from 'react-icons/ri';
import Popup from '@/Components/Popup';

export default function ResultsGrid({ results, mode, setMode, totalCount, activeFilters, removeFilter, onLoadMore }) {
    const renderedItems = useMemo(() => {
        const items = [];
        (results || []).forEach((item, index) => {
            let card;
            switch(mode) {
                case 'creator':
                    card = <CreatorGridCard item={item} />;
                    break;
                case 'wish':
                    card = <WishGridCard item={item} />;
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
        <div className="flex-1">
            {/* Block 4: Results Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Showing {totalCount} results
                    </h2>
                    {/* Active Filter Chips */}
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
                                 // Simple handling for min/max price display
                                 return null; 
                             }
                             return null;
                        })}
                    </div>
                </div>

                {/* Mode Toggle & Sort */}
                <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setMode('creator')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                mode === 'creator' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <RiUserHeartLine /> Creators
                        </button>
                        <button
                            onClick={() => setMode('wish')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                mode === 'wish' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <RiGiftLine /> Wishes
                        </button>
                    </div>
                </div>
            </div>

            {/* Block 5: Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {renderedItems}
            </div>
            
            {/* Load More / Pagination */}
            <div className="mt-12 text-center">
                <button 
                    onClick={onLoadMore}
                    className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                >
                    Load More Results
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

const CreatorGridCard = React.memo(function CreatorGridCard({ item }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 h-full flex flex-col relative group">
            {/* Full Card Link */}
            <Link href={route('user.show', item.username)} className="absolute inset-0 z-0" />

            <div className="flex items-start justify-between mb-4 z-10 relative pointer-events-none">
                <div className="flex items-center gap-3 group pointer-events-auto">
                    <img 
                        src={item.avatar_url || 'https://via.placeholder.com/150'} 
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-50 group-hover:border-pink-200 transition-colors"
                        loading="lazy"
                        decoding="async"
                    />
                    <div>
                        <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-pink-600 transition-colors">{item.name}</h3>
                        <p className="text-xs text-gray-500">@{item.username}</p>
                    </div>
                </div>
                {(item.role === 1 || item.is_verified) && <span className="text-blue-500 bg-blue-50 p-1 rounded-full text-xs" title="Verified"><RiCheckDoubleLine /></span>}
            </div>
            
            <div className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow group-hover:text-gray-900 z-10 relative pointer-events-none">
                {item.bio || `Support ${item.name} to help them achieve their dreams!`}
            </div>
            
            {/* Intro Video Poster */}
            {item.intro && item.intro.poster_url ? (
                <div className="mb-4 z-10 relative pointer-events-auto">
                    <Popup
                        space="0"
                        size="md"
                        classes="block w-full"
                        text={
                            <div className="relative rounded-xl overflow-hidden h-40 bg-black">
                                <img
                                    src={item.intro.poster_url}
                                    alt={`${item.name} intro`}
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="32" cy="32" r="32" fill="#F94F97"/>
                                        <path d="M40 32.0234L22.72 22.0468V42L40 32.0234Z" fill="black"/>
                                    </svg>
                                </div>
                            </div>
                        }
                    >
                        <div className="video-payer-pop">
                            <video
                                playsInline
                                controls
                                autoPlay
                                controlsList="nodownload"
                                poster={item.intro.poster_url}
                            >
                                <source src={item.intro.perma_link} type="video/mp4" />
                            </video>
                        </div>
                    </Popup>
                </div>
            ) : null}

            {/* Removed wishes preview in creator cards as requested */}

            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto z-10 relative pointer-events-none">
                <span className="text-xs font-medium text-gray-900">
                    {item.clicks_24h ? `${item.clicks_24h} views today` : 'New Creator'}
                </span>
                <div className="flex gap-2 pointer-events-auto">
                    <Link href={route('user.show', item.username)} className="px-3 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 rounded-lg hover:bg-pink-100">
                        View
                    </Link>
                    <Link href={route('user.show', item.username)} className="px-3 py-1.5 text-xs font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 shadow-sm">
                        Support
                    </Link>
                </div>
            </div>
        </div>
    );
});

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
                        <Link href={profileUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-20">
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
                   Bill
                </div>
            </div>

            <div className="p-4 flex flex-col flex-grow z-10 relative pointer-events-none">
                <div className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                    {item.title}
                </div>
                
                <div className="flex items-center gap-2 mb-4 pointer-events-auto">
                     {item.user && (
                        <Link href={profileUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-20">
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
                        <Link href={profileUrl}
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
                        <Link href={profileUrl} className="flex items-center gap-2 hover:opacity-80 transition-opacity relative z-20">
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
                        <Link href={profileUrl}
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
