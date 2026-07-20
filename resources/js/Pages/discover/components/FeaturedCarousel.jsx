import { Link, usePage } from '@inertiajs/react';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import CreatorCard from './CreatorCard';
import { trackSearchClick } from "@/includes/Analytics";
import Bill from '../../bills/Bill';
import Membership from '../../membership/Membership';
import TaskItem from '../../../Components/TaskItem';
import ShopCard from '../../../Components/ShopCard';

export default function FeaturedCarousel({ title, items, type = 'creator', icon }) {
    
    const {global_currency, auth, IsloggedIn} = usePage().props;
    
    // Handle loading state for lazy props
    const isLoading = items === undefined || items === null;
    
    // Skeleton items to show while loading
    const skeletonItems = Array(4).fill(0);

    let linkContentType = 'Creators';
    if (type === 'wish') linkContentType = 'Wishes';
    else if (type === 'bill') linkContentType = 'Bills';
    else if (type === 'membership') linkContentType = 'Memberships';
    else if (type === 'task') linkContentType = 'Tasks';
    else if (type === 'shop') linkContentType = 'Shops';
    const isTaskLayout = type === 'task';

    return (
        <div className="!pb-[40px]">
            <div className="pt-4 flex items-center justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl text-black font-anton tracking-wide uppercase">{title || 'Creators'}</h2>
                <Link href={route('discover', { contentType: linkContentType })} className="shrink-0 text-xs md:text-sm font-semibold text-black/70 uppercase tracking-wider border border-black/15 bg-white px-4 py-1.5 rounded-[20px] hover:text-black hover:border-[#FF007F]/60 transition-all">See all</Link>
            </div>
            <div className={`${isTaskLayout ? 'grid grid-cols-1 gap-4 pb-4' : type === 'creator' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 pb-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-4'}`}>
                {isLoading ? (
                    skeletonItems.map((_, index) => (
                        <div key={`skeleton-${index}`} className="h-[200px] bg-black/5 animate-pulse border border-black/10 rounded-[30px]" />
                    ))
                ) : (
                    <>
                    {items.map((item, index) => (
                        <div key={item.id || index} className={isTaskLayout ? 'col-span-full' : ''}>
                            {type === 'creator' && <CreatorCard item={item} auth={auth} />}
                            {type === 'wish' && 
                                <Wishlistbox
                                    key={`wish-item-${item.id}`}
                                    classes=""
                                    imagesize="max-h-[150px]"
                                    currency={global_currency}
                                    IsloggedIn={false}
                                    auth={auth.user}
                                    itemid={item?.id}
                                    itm={item}
                                />
                            }
                            {type === 'bill' && <Bill  classes="" itm={item}/>}
                            {type === 'membership' &&  <Membership  item={item} /> }
                            {type === 'task' && <TaskItem task={item} IsloggedIn={false} profileUser={item.user} />}
                            {type === 'shop' && <ShopCard item={item} classes="" />}
                        </div>
                    ))}
                    <div className='flex justify-center sm:hidden col-span-full !mt-2'>
                        <Link href={route('discover', { contentType: linkContentType })} className="text-xs font-semibold text-black/70 uppercase tracking-wider border border-black/15 bg-white px-5 py-2 rounded-[20px] hover:text-black hover:border-[#FF007F]/60 transition-all">See all</Link>
                    </div>
                    </>
                     
                )}
            </div>
        </div>
    );
}
 
