import { Link, usePage } from '@inertiajs/react';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import CreatorCard from './CreatorCard';
import { trackSearchClick } from "@/includes/Analytics";
import Bill from '../../bills/Bill';
import Membership from '../../membership/Membership';
import TaskItem from '../../../Components/TaskItem';
import ShopCard from '../../../Components/ShopCard';
import { DISCOVERY_SOURCE } from "@/lib/discoveryLink";
import SectionShelf from './SectionShelf';

/**
 * A featured carousel is Spenny Piggy CHOOSING who a supporter sees, so every
 * creator link inside it is SP-generated traffic and must carry a Discovery
 * source. 🚨 A surface that is not tagged is invisible for ever — attribution
 * is recorded at the moment of the visit and there is no backfill.
 *
 * @param {string} [discoverySource] one of the twelve reserved keys. Defaults
 *   to `search-recs`, the key for Discover's own surfaces; the caller passes a
 *   collection key (`trending`, `new-creators`, `new-wishes`) where one fits,
 *   so the monthly report can tell the collections apart.
 */
export default function FeaturedCarousel({ title, items, type = 'creator', icon, kicker, subtitle, discoverySource = DISCOVERY_SOURCE.SEARCH_RECS }) {
    
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
            {/* One header for every section on this page — see SectionShelf. */}
            <SectionShelf
                kicker={kicker}
                title={title || 'Creators'}
                subtitle={subtitle}
                count={!isLoading && items?.length ? items.length : null}
                action={
                    <Link
                        href={route('discover', { contentType: linkContentType })}
                        className="inline-flex min-h-[40px] items-center rounded-box-sm border border-black/15 bg-white px-4 text-xs font-semibold uppercase tracking-wider text-black/70 transition-all hover:border-[#FF007F]/60 hover:text-black md:text-sm"
                    >
                        See all
                    </Link>
                }
            />
            <div className={`${isTaskLayout ? 'grid grid-cols-1 gap-4 pb-4' : type === 'creator' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5 pb-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 pb-4'}`}>
                {isLoading ? (
                    skeletonItems.map((_, index) => (
                        <div key={`skeleton-${index}`} className="h-[200px] bg-black/5 animate-pulse border border-black/10 rounded-box" />
                    ))
                ) : (
                    <>
                    {items.map((item, index) => (
                        <div key={item.id || index} className={isTaskLayout ? 'col-span-full' : ''}>
                            {type === 'creator' && <CreatorCard item={item} auth={auth} discoverySource={discoverySource} />}
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
                                    discoverySource={discoverySource}
                                />
                            }
                            {type === 'bill' && <Bill  classes="" itm={item} discoverySource={discoverySource} />}
                            {/* MembershipItem and TaskItem carry no creator-profile
                                link — their cards go to checkout and to /task/{uuid} —
                                so there is nothing here to tag. */}
                            {type === 'membership' &&  <Membership  item={item} /> }
                            {type === 'task' && <TaskItem task={item} IsloggedIn={false} profileUser={item.user} />}
                            {/* No `showCreator` here, deliberately — this carousel's shop card
                                renders no creator link, so there is nothing to tag.
                                `discoverySource` is passed so it tags itself the day
                                the handle is turned on. */}
                            {type === 'shop' && <ShopCard item={item} classes="" discoverySource={discoverySource} />}
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
 
