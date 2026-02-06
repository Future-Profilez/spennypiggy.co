import { useState } from "react";
import PriceFormat from '@/includes/PriceFormat';
import mouse from '../../../assets/img/mouse.png';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect } from 'react';

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
    <>
    <div className='mb-4 pink-round p-0'>
        <h2 className='text-lg  font-GillSans uppercase pinkbg p-3 text-white btn-shadow'>{goal?.name || 'MY PIGGY BANK'}</h2>
      <div className='p-3' >
        <p className='mb-3 '>Total Support</p>
        <div className="relative w-full h-[9px] bg-[#eccedb] rounded-lg overflow-visible mb-4">
             <div 
                className="h-full bg-pink-600 rounded-lg relative" 
                style={{ width: `${percentage}%` }}
             >
                 <div 
                    className="absolute top-[-7px] right-[-27px] w-[50px] h-[50px] bg-contain bg-no-repeat pointer-events-none"
                    style={{ backgroundImage: `url('${mouse}')` }}
                 ></div>
             </div>
        </div>
        
          {IsloggedIn ?
            <p className='text-gray-500 text-sm mt-2' >
                          {formatMultiPrice(goal?.fullfilled, goal?.currency)} earned.
                        </p> 
            : 
            <>
              {user && user?.show_piggy_bank ? <p className='text-gray-500 text-sm mt-2' >{formatMultiPrice(goal?.fullfilled, goal?.currency)} earned.</p> : '' }
            </>
          }
      </div>
    </div>
    </>
  )
}
