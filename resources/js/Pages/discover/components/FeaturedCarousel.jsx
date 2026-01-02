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
        <div className="!pb-[30px]">
            <div className="pt-4 flex items-center gap-2 mb-3">
                <h2 className="text-2xl text-gray-900 font-gulfs uppercase ">{title || 'Creators'}</h2>
                <Link href={route('discover', { contentType: linkContentType })} className=" ml-auto text-sm text-pink-500 font-medium hover:text-pink-600">See All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 pb-4  "> 
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
 