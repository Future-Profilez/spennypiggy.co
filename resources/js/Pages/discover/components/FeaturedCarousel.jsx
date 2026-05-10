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
            <div className="pt-4 sm:flex items-center gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl text-black font-anton tracking-wider uppercase ">{title || 'Creators'}</h2>
                <div className='hidden sm:block !mt-2 sm:mt-0 '>
                    <Link href={route('discover', { contentType: linkContentType })} className="ml-auto text-sm md:text-base text-black font-black uppercase border-2 border-black bg-white px-4 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">See All</Link>
                </div>
            </div>
            <div className={`${isTaskLayout ? 'grid grid-cols-1 gap-4 pb-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-4'}`}> 
                {isLoading ? (
                    skeletonItems.map((_, index) => (
                        <div key={`skeleton-${index}`} className="h-[200px] bg-gray-200/40 animate-pulse border-2 border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
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
                    <div className='flex justify-center sm:hidden !mt-2 sm:mt-0 '>
                        <Link href={route('discover', { contentType: linkContentType })} className="text-sm md:text-base text-black font-black uppercase border-2 border-black bg-white px-4 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">See All</Link>
                    </div>
                    </>
                     
                )}
            </div>
        </div>
    );
}
 
