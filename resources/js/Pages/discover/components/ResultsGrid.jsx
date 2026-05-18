import { Link, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import DeviceID from '@/includes/DeviceID';
import { RiLayoutGridFill, RiUserHeartLine, RiGiftLine, RiCloseLine, RiFireLine, RiCheckDoubleLine, RiSearchLine, RiFileList3Line, RiVipCrownLine } from 'react-icons/ri';
import Popup from '@/Components/Popup';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import Avatar from '../../../includes/Avatar';
import CreatorCard from './CreatorCard';
import { trackSearchClick } from "@/includes/Analytics";
import Bill from '../../bills/Bill';
import Membership from '../../membership/Membership';
import ProfileProduct from '../../shop/ProfileProduct';
import TaskItem from '@/Components/TaskItem';

export default function ResultsGrid({auth, global_currency, results, mode, activeFilters, removeFilter }) {
    const renderedItems = useMemo(() => {
        const items = [];
        (results || []).forEach((item, index) => {
            let card;
            switch(mode) {
                case 'creator':
                    card = <CreatorCard  item={item} auth={auth} />;
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
                    card = <Bill classes=" " itm={item} />;
                    break;
                case 'membership':
                    card = <Membership  item={item} />;
                    break;
                case 'shop':
                    card = <ProfileProduct item={item} />;
                    break;
                case 'task':
                    card = <TaskItem task={item} IsloggedIn={false} profileUser={item.user} />;
                    break;
                default:
                    card = <Wishlistbox
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
            }

            items.push(
                <div
                    key={item.id}
                    className={`h-full ${mode === 'task' ? 'col-span-full' : ''}`}
                >
                    {card}
                </div>
            );
            
            if (['creator', 'wish'].includes(mode) && (index + 1) % 12 === 0 && index !== results.length - 1) {
                items.push(
                    <div key={`spotlight-${index}`} className="col-span-full my-8">
                        <SpotlightSection index={(index + 1) / 12} />
                    </div>
                );
            }
        });
        
        if (items.length === 0) {
             return (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-[30px]   border border-dashed border-gray-200">
                     <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6">
                        <RiSearchLine className="text-4xl text-[#FF007F]" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">No matches found</h3>
                     <p className="text-gray-500 max-w-md mb-8">
                        We couldn't find any items matching your current filters. Try adjusting your search or filters.
                     </p>
                     <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-3 bg-gray-900 text-white rounded-[30px]  font-bold hover:bg-black transition-colors"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                {renderedItems}
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
 
function SpotlightSection({ index }) {
    const spotlights = [
        { title: "Ending Soon ⏳", subtitle: "Wishes expiring in 24h", color: "bg-orange-50 border-orange-100" },
        { title: "Trending Now 🔥", subtitle: "Popular creators and wishes", color: "bg-pink-50 border-pink-100" },
        { title: "Quick Wins ⚡", subtitle: "Wishes under £20", color: "bg-green-50 border-green-100" },
    ];
    const spot = spotlights[index % spotlights.length];

    return (
        <div className={`rounded-[30px]   border p-6 ${spot.color} flex flex-col md:flex-row items-center justify-between gap-6`}>
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{spot.title}</h3>
                <p className="text-gray-600">{spot.subtitle}</p>
            </div>
            {spot.title === "Trending Now 🔥" ? (
                <Link href={route('discover', { type: 'trending', page: 1 })} className="px-6 py-3 bg-white text-gray-900 font-bold rounded-[30px]  shadow-sm hover:shadow-md transition-all">
                    View Collection
                </Link>
            ) : spot.title === "Quick Wins ⚡" ? (
                <Link href={route('discover', { search: 'under 20', page: 1 })} className="px-6 py-3 bg-white text-gray-900 font-bold rounded-[30px]  shadow-sm hover:shadow-md transition-all">
                    View Collection
                </Link>
            ) : (
                <Link href={route('discover', { search: 'expiring', page: 1 })} className="px-6 py-3 bg-white text-gray-900 font-bold rounded-[30px]  shadow-sm hover:shadow-md transition-all">
                    View Collection
                </Link>
            )}
        </div>
    );
}
