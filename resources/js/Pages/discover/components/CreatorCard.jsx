import { Link } from '@inertiajs/react';
import wishlistbannerimg from "../../../../assets/img/wishlistbannerimg.jpg";
import Avatar from '../../../includes/Avatar';
import { trackSearchClick } from "@/includes/Analytics";

export default function CreatorCard({item}) {
   return (
       <Link href={route('user.show', item.username)} onClick={() => trackSearchClick(item.id, item.username)} className="overflow-hidden !rounded-xl flex flex-col items-center text-start group cursor-pointer block ">
           <div className="relative">
               <div className="h-full w-full bg-black max-h-[260px] overflow-hidden group-hover:border-pink-500 transition-colors">
                   <img src={item.cover_url || wishlistbannerimg} alt={item.name} className="w-full h-full object-cover bg-black" loading="lazy" />
                   <div className='!z-2 absolute top-3 left-3 flex justify-center'>
                       <Avatar role={item.role}
                       hidename={true}
                       profile_status_lock={item.profile_status_lock == 2 ? true : false}
                       name={item.name} link={item.username || null} src={item.avatar_url}
                       subhead={`@${item.username || "anonymous"}`} username={item.username || ""}
                       // onClick={() => trackSearchClick(item.id, item.username)}
                       />
                   </div>
               </div>
           </div>
           <div className='w-full bg-gray-100 p-3'>
               <h3 className="text-normal font-semibold text-gray-900 truncate w-full px-1 group-hover:text-pink-600 transition-colors">{item.name}</h3>
               <p className="text-sm text-gray-600 truncate w-full px-1">@{item.username}</p>
               {/* <p className="text-xs mt-1 text-gray-500 truncate w-full px-1">{item.bio}</p> */}
           </div>
       
           {item.clicks_24h > 0 && (
               <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                   <RiFireLine size={10} /> {item.clicks_24h}
               </p>
           )}
   
           {/* {item.total_amount && (
               <p className="text-xs font-medium text-green-600 mt-1">{item.total_amount}</p>
           )} */}
   
       </Link>
   );
}
