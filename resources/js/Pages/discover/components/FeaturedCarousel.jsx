import { Link, usePage } from '@inertiajs/react';
import Wishlistbox from '../../../wishlist/Wishlistbox';
import CreatorCard from './CreatorCard';
import { trackSearchClick } from "@/includes/Analytics";
import Bill from '../../bills/Bill';
import Membership from '../../membership/Membership';

export default function FeaturedCarousel({ title, items, type = 'creator', icon }) {
    
    const {global_currency, auth, IsloggedIn} = usePage().props;
    
    if (!items || items.length === 0) return null;
    
    let linkContentType = 'Creators';
    if (type === 'wish') linkContentType = 'Wishes';
    else if (type === 'bill') linkContentType = 'Bills';
    else if (type === 'membership') linkContentType = 'Memberships';

    return (
        <div className="!pb-[40px]">
            <div className="pt-4 flex items-center gap-3 mb-6">
                <h2 className="text-3xl text-black font-anton tracking-wider uppercase ">{title || 'Creators'}</h2>
                <Link href={route('discover', { contentType: linkContentType })} className=" ml-auto text-sm md:text-base text-black font-black uppercase border-2 border-black bg-white px-4 py-1 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">See All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-4  "> 
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
                        {type === 'bill' && <Bill  classes="" itm={item}/>
                            // IsloggedIn={IsloggedIn}
                        }
                        {type === 'membership' &&  <Membership  item={item} /> }
                    </div>
                ))}
            </div>
        </div>
    );
}
 