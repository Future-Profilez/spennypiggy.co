import { useState } from "react";
import PriceFormat from '@/includes/PriceFormat';
import mouse from '../../../assets/img/mouse.png';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect } from 'react';
import { RiGroupLine } from "react-icons/ri";

export default function MyGoal({  IsloggedIn}) {

  const { user } = usePage().props;
  const { formatMultiPrice } = PriceFormat();
  const [goal, setGoal] = useState(null);

  const fetchGoal = () => {
     axios.get(`/user/tip/goal/${user?.username}`).then(resp => {
        setGoal(resp.data.goal);
     }).catch(_err => {
        console.error("error", _err);
     });
  }

  useEffect(() => {
    fetchGoal();
  }, []);

  const percentage = goal?.target ? Math.min(100, Math.round((goal.fullfilled / goal.target) * 100)) : 0;

  return (
    <div className='mb-8 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl transition-all hover:border-white/10 group'>
        <div className="bg-[#F94F97] p-5">
            <h2 className='text-normal font-black font-gulfs tracking-[0.15em] uppercase text-white flex items-center gap-3'>
                {goal?.name || 'MY PIGGY BANK'}
            </h2>
        </div>
        <div className='p-6 bg-white' >
            <p className='mb-6 text-black/40 font-black text-[10px] tracking-[0.2em] uppercase'>Total Support</p>
            <div className="relative w-full h-[12px] bg-[#F3F4F6] rounded-full overflow-visible mb-6">
                 <div className="h-full bg-[#F94F97] rounded-full relative shadow-[0_0_20px_rgba(249,79,150,0.3)] transition-all duration-1000" 
                    style={{ width: `${percentage}%` }} >
                     <div className="absolute mt-2 top-1/2 right-[-20px] -translate-y-1/2 w-[45px] h-[45px] bg-contain bg-no-repeat pointer-events-none drop-shadow-xl hover:scale-110 transition-transform"
                        style={{ backgroundImage: `url('${mouse}')` }} ></div>
                 </div>
            </div>
            
            {/* <div className="hidden flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-black/30 font-black text-[10px] tracking-[0.1em] uppercase">Progress</span>
                <span className="text-[#F94F97] font-black text-xl tracking-tight">
                    {percentage}%
                </span>
            </div> */}
            
            {!IsloggedIn ?
                <p className='text-black/50 text-sm font-medium mt-4' >
                    <span className="text-black font-black">{formatMultiPrice(goal?.fullfilled, goal?.currency)}</span> earned of {formatMultiPrice(goal?.target, goal?.currency)}
                </p> 
                : 
                <>
                    {user && user?.show_piggy_bank ? 
                        <p className='text-black/50 text-sm font-medium mt-4' >
                            <span className="text-black font-black">{formatMultiPrice(goal?.fullfilled, goal?.currency)}</span> earned.
                        </p> 
                    : '' }
                </>
            }
        </div>
    </div>
  )
}
