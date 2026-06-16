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
    // <div className='mb-6 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[30px]   overflow-hidden shadow-[4px_4px_0px_0px_#FF007F]xl transition-all hover:border-white/10 group'>
    <div className='mt-6 pt-4 overflow-hidden  group'>
        {/* <div className="bg-[#FF007F] p-5">
            <h2 className='text-[17px] font-black font-gulfs tracking-[0.15em] uppercase text-white flex items-center gap-3 btn-shadow'>
                {goal?.name || 'MY PIGGY BANK'}
            </h2>
        </div> */}
        <div className='' >
            <p className='mb-6 text-black/40 font-black text-[13px] tracking-[0.2em] uppercase'>Total Earned</p>
            <div className="relative w-full h-[12px] bg-[#F3F4F6] rounded-full overflow-visible mb-6">
                 <div className="h-full bg-[#FF007F] rounded-full relative shadow-[0_0_20px_rgba(249,79,150,0.3)] transition-all duration-1000" 
                    style={{ width: `${percentage}%` }} >
                     <div className="absolute mt-2 top-1/2 right-[-40px] -translate-y-1/2 w-[45px] h-[45px] bg-contain bg-no-repeat pointer-events-none drop-shadow-[4px_4px_0px_0px_#FF007F]l hover:scale-110 transition-transform"
                        style={{ backgroundImage: `url('${mouse}')` }} ></div>
                 </div>
            </div>
            
            {/* <div className="hidden flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-black/30 font-black text-[10px] tracking-[0.1em] uppercase">Progress</span>
                <span className="text-[#FF007F] font-black text-xl tracking-tight">
                    {percentage}%
                </span>
            </div> */}

            {IsloggedIn ?
                <p className='text-black/50 text-normal font-medium mt-4' >
                    <span className="text-black font-black">{formatMultiPrice(goal?.fullfilled, goal?.currency)}</span> earned of {formatMultiPrice(goal?.target, goal?.currency)}
                </p> 
            :  '' }

            {!IsloggedIn && user && user?.show_piggy_bank ?
                <p className='text-black/50 text-normal font-medium mt-4' >
                    <span className="text-black font-black">{formatMultiPrice(goal?.fullfilled, goal?.currency)}</span> earned of {formatMultiPrice(goal?.target, goal?.currency)}
                </p> 
            : '' }

            {IsloggedIn ? <p>Current Target is {formatMultiPrice(goal?.target, goal?.currency)} *target increases when met.</p> : ''}

        </div>
    </div>
  )
}
