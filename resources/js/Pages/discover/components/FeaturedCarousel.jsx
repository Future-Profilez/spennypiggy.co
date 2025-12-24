import React from 'react';
import { Link } from '@inertiajs/react';
import { RiUserHeartLine, RiCheckDoubleLine, RiFireLine, RiMoneyPoundCircleLine } from 'react-icons/ri';

export default function FeaturedCarousel({ title, items, type = 'creator', icon }) {
    if (!items || items.length === 0) return null;
    
    let linkContentType = 'Creators';
    if (type === 'wish') linkContentType = 'Wishes';
    else if (type === 'bill') linkContentType = 'Bills';
    else if (type === 'membership') linkContentType = 'Memberships';

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                {icon && <span className="text-pink-500 text-xl">{icon}</span>}
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <Link href={route('discover', { contentType: linkContentType })} className="ml-auto text-sm text-pink-500 font-medium hover:text-pink-600">See All</Link>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x snap-mandatory">
                {items.map((item, index) => (
                    <div 
                        key={item.id || index} 
                        className={`snap-start flex-shrink-0 ${type === 'creator' ? 'w-32' : 'w-48'}`}
                    >
                        {type === 'creator' && <CreatorCard item={item} />}
                        {type === 'wish' && <WishCard item={item} />}
                        {type === 'bill' && <BillCard item={item} />}
                        {type === 'membership' && <MembershipCard item={item} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

function CreatorCard({ item }) {
    return (
        <Link href={route('user.show', item.username)} className="flex flex-col items-center text-center group cursor-pointer block">
            <div className="relative mb-2">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-pink-500 transition-colors">
                    <img 
                        src={item.avatar_url || 'https://via.placeholder.com/150'} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
                {item.role === 1 && ( 
                    <div className="absolute bottom-0 right-1 bg-blue-500 text-white p-0.5 rounded-full border-2 border-white">
                        <RiCheckDoubleLine size={12} />
                    </div>
                )}
                {item.is_number_one && (
                     <div className="absolute top-0 right-0 bg-yellow-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
                        #1
                    </div>
                )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 truncate w-full px-1 group-hover:text-pink-600 transition-colors">{item.name}</h3>
            <p className="text-xs text-gray-500 truncate w-full px-1">@{item.username}</p>
            {item.total_amount && (
                <p className="text-xs font-medium text-green-600 mt-1">{item.total_amount}</p>
            )}
            {item.clicks_24h > 0 && (
                <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                    <RiFireLine size={10} /> {item.clicks_24h}
                </p>
            )}
        </Link>
    );
}

function WishCard({ item }) {
    const linkUrl = item.user ? route('user.show', item.user.username) : '#';
    return (
        <>
            <Link href={linkUrl} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col block">
                <div className="relative h-32 bg-gray-100">
                    {item.perma_link}
                    <img  
                        src={item.perma_link || 'https://via.placeholder.com/300'} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {item.amount ? `£${item.amount}` : 'Free'}
                    </div>
                </div>
                <div className="p-3 flex flex-col flex-grow">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">{item.title}</h3>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                        {item.user && (
                            <>
                                <img 
                                    src={item.user.avatar_url || 'https://via.placeholder.com/30'} 
                                    alt={item.user.name}
                                    className="w-5 h-5 rounded-full object-cover border border-gray-100"
                                />
                                <span className="text-xs text-gray-500 truncate">@{item.user.username}</span>
                            </>
                        )}
                    </div>
                </div>
            </Link>
        </>
    );
}

function BillCard({ item }) {
    const linkUrl = item.user ? route('user.show', item.user.username) : '#';

    return (
        <Link href={linkUrl} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col block">
            <div className="relative h-32 bg-gray-100">
                 <img 
                    src={item.image_url || 'https://via.placeholder.com/300'} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Bill
                </div>
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">{item.title}</h3>
                <div className="mt-auto flex items-center gap-2 pt-2">
                    {item.user && (
                        <>
                             <img 
                                src={item.user.avatar_url || 'https://via.placeholder.com/30'} 
                                alt={item.user.name}
                                className="w-5 h-5 rounded-full object-cover border border-gray-100"
                            />
                            <span className="text-xs text-gray-500 truncate">@{item.user.username}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}

function MembershipCard({ item }) {
    const linkUrl = item.user ? route('user.show', item.user.username) : '#';

    return (
        <Link href={linkUrl} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col block">
            <div className="relative h-32 bg-gray-100">
                 <img 
                    src={item.image_url || 'https://via.placeholder.com/300'} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Join
                </div>
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-pink-600 transition-colors">{item.title}</h3>
                <div className="mt-auto flex items-center gap-2 pt-2">
                    {item.user && (
                        <>
                             <img 
                                src={item.user.avatar_url || 'https://via.placeholder.com/30'} 
                                alt={item.user.name}
                                className="w-5 h-5 rounded-full object-cover border border-gray-100"
                            />
                            <span className="text-xs text-gray-500 truncate">@{item.user.username}</span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
}