import { Link } from '@inertiajs/react';
import wishlistbannerimg from "../../../../assets/img/wishlistbannerimg.jpg";
import Avatar from '../../../includes/Avatar';
import { trackSearchClick } from "@/includes/Analytics";
import { RiFireLine  } from 'react-icons/ri';

export default function CreatorCard({auth, item}) {
   return (
       <Link href={route('user.show', item.username)} onClick={() => trackSearchClick(item.id, item.username)} 
       className="relative bg-white fading rounded-[30px] overflow-hidden flex flex-col items-center text-left group cursor-pointer block border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all  rounded-[30px]bg-[#fdfbf7]">
            <div className="h-full w-full max-h-[260px] overflow-hidden transition-colors !border-b-[3px] border-b-black relative">
                <img src={item.cover_url || wishlistbannerimg} alt={item.name} 
                className="w-full h-[100px] object-cover bg-white" loading="lazy" />
                <div className='!z-2 absolute top-4 left-4 flex justify-center'>
                    <Avatar
                    auth={auth}
                    user={item} 
                    role={item.role}
                    hidename={true}
                    profile_status_lock={item.profile_status_lock == 2 ? true : false}
                    name={item.name} link={item.username || null} src={item.avatar_url}
                    subhead={`@${item.username || "anonymous"}`} username={item.username || ""}
                    className="border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    // onClick={() => trackSearchClick(item.id, item.username)}
                    />
                </div>
            </div>
           <div className='w-full p-4 flex-grow'>
               <h3 className="text-lg font-black text-black uppercase tracking-wider truncate w-full group-hover:text-pink-600 transition-colors">{item.name}</h3>
               <p className="text-sm font-bold text-gray-700 truncate w-full">@{item.username}</p>
               {/* <p className="text-xs mt-1 text-gray-500 truncate w-full px-1">{item.bio}</p> */}
           </div>
       
           {item.clicks_24h > 0 && (
               <div className="w-full p-3 border-t-[3px] border-black bg-yellow-300 flex justify-center">
                    <p className="text-xs font-black text-black flex items-center justify-center gap-1 uppercase">
                        <RiFireLine size={14} /> {item.clicks_24h} views today
                    </p>
               </div>
           )}
   
           {/* {item.total_amount && (
               <p className="text-xs font-medium text-green-600 mt-1">{item.total_amount}</p>
           )} */}
   
       </Link>
   );
}
