import { Link, usePage } from '@inertiajs/react';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import CreatorCard from './CreatorCard';
import { trackSearchClick } from "@/includes/Analytics";
import Bill from '../../bills/Bill';
import Membership from '../../membership/Membership';
import TaskItem from '../../../Components/TaskItem';
import ShopCard from '../../../Components/ShopCard';

export default function FeaturedCarousel({ title, items, type = 'creator', icon, kicker, subtitle }) {
    
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
            {/* Section head: a kicker names the product type, the subtitle says what
                the buyer actually gets from it. Six identical headers read as one
                undifferentiated wall — and nobody buys what they can't tell apart. */}
            <div className="pt-4 mb-6 flex items-end justify-between gap-4">
                <div className="min-w-0">
                    {kicker && (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF007F]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" />
                            {kicker}
                            {!isLoading && items?.length ? (
                                <span className="ml-1 rounded-box-sm bg-black/[0.06] px-2 py-0.5 text-[12px] font-bold text-black/60">
                                    {items.length}
                                </span>
                            ) : null}
                        </span>
                    )}
                    <h2 className="mt-1 text-xl sm:text-2xl md:text-3xl text-black font-anton tracking-wide uppercase">{title || 'Creators'}</h2>
                    {subtitle && (
                        <p className="mt-1.5 max-w-xl text-[13px] font-medium leading-snug text-black/60">{subtitle}</p>
                    )}
                </div>
                <Link href={route('discover', { contentType: linkContentType })} className="shrink-0 inline-flex min-h-[44px] items-center text-xs md:text-sm font-semibold text-black/70 uppercase tracking-wider border border-black/15 bg-white px-4 rounded-box-sm hover:text-black hover:border-[#FF007F]/60 transition-all">See all</Link>
            </div>
            <div className={`${isTaskLayout ? 'grid grid-cols-1 gap-4 pb-4' : type === 'creator' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 pb-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-4'}`}>
                {isLoading ? (
                    skeletonItems.map((_, index) => (
                        <div key={`skeleton-${index}`} className="h-[200px] bg-black/5 animate-pulse border border-black/10 rounded-box" />
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
                        <Link href={route('discover', { contentType: linkContentType })} className="text-xs font-semibold text-black/70 uppercase tracking-wider border border-black/15 bg-white inline-flex items-center min-h-[44px] px-5 py-2 rounded-box-sm hover:text-black hover:border-[#FF007F]/60 transition-all">See all</Link>
                    </div>
                    </>
                     
                )}
            </div>
        </div>
    );
}
 
