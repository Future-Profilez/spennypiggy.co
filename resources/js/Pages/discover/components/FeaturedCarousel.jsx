import { Link, usePage } from '@inertiajs/react';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import CreatorCard from './CreatorCard';
import { trackSearchClick } from "@/includes/Analytics";

export default function FeaturedCarousel({ title, items, type = 'creator', icon }) {
    
    const {global_currency, auth, IsloggedIn} = usePage().props;
    
    if (!items || items.length === 0) return null;
    
    let linkContentType = 'Creators';
    if (type === 'wish') linkContentType = 'Wishes';
    else if (type === 'bill') linkContentType = 'Bills';
    else if (type === 'membership') linkContentType = 'Memberships';

    return (
        <div className="!pb-[30px]">
            <div className="pt-4 flex items-center gap-2 mb-3">
                <h2 className="text-2xl text-gray-900 font-gulfs uppercase">{title}</h2>
                <Link href={route('discover', { contentType: linkContentType })} className="ml-auto text-sm text-pink-500 font-medium hover:text-pink-600">See All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pb-4  "> 
                {items.map((item, index) => (
                    <div  key={item.id || index}  className={``} >
                        {type === 'creator' && <CreatorCard item={item} />}
                        {type === 'wish' && 
                            <Wishlistbox
                                key={`wish-item-${item.id}`}
                                classes=""
                                imagesize="max-h-[150px]"
                                currency={global_currency}
                                IsloggedIn={false}
                                auth={auth.user}
                                itemid={item?.id}
                                // setuped={AuthUserStripeConnected ==1? true: false}
                                itm={item}
                            />
                        }
                        {type === 'bill' && <BillCard item={item} />}
                        {type === 'membership' && <MembershipCard item={item} />}
                    </div>
                ))}
            </div>
        </div>
    );
}


function BillCard({ item }) {
    const linkUrl = item.user ? route('user.show', item.user.username) : '#';

    return (
        <Link href={linkUrl} onClick={() => item.user && trackSearchClick(item.user.id, item.user.username)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col block">
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
