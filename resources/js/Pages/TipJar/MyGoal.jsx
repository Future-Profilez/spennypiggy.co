import { useState } from "react";
import ProgressBar from 'react-bootstrap/ProgressBar';
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


  return (
    <>
    <style>{`
    .mygoal .progress-bar:after { content: ''; background-image: url('${mouse}'); background-repeat:no-repeat;padding:17px;background-size:contain;position:absolute;top:-7px;right:-27px;}
    .mygoal .progress-bar{position:relative;overflow:visible !important;border-radius:8px;}
    .mygoal .progress{background:#eccedb;height:9px;overflow:visible;}
    `}</style>
    <div className='mb-4 pink-round p-0'>
        <h2 className='text-large  font-GillSans text-uppercase pinkbg p-3 text-white btn-shadow'>{goal?.name || 'MY PIGGY BANK'}</h2>
      <div className='p-3' >
        <p className='mb-3 '>Total Support</p>
        <ProgressBar aria-label="Earnings" title="Earnings" now={goal?.fullfilled}  max={goal?.target} />
          {IsloggedIn ?
            <p className='text-muted text-small mt-2' >
              {formatMultiPrice(goal?.fullfilled, goal?.currency)} earned.
            </p> 
            : 
            <>
              {user && user?.show_piggy_bank ? <p className='text-muted text-small mt-2' >{formatMultiPrice(goal?.fullfilled, goal?.currency)} earned.</p> : '' }
            </>
          }
      </div>
    </div>
    </>
  )
}
