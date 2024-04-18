import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import PriceFormat from '@/includes/PriceFormat';
import mouse from '../../../assets/img/mouse.png';

export default function MyGoal({goal}) {
  const { formatMultiPrice } = PriceFormat();
  const getPercentage = (actual, paid) => {
    const r = (paid/actual)*100;
    return r.toFixed(2);
  }

  return (
    <>
    <style>{`
    .mygoal .progress-bar:after { content: ''; background-image: url('${mouse}'); background-repeat:no-repeat;padding:17px;background-size:contain;position:absolute;top:-7px;right:-27px;}
    .mygoal .progress-bar{position:relative;overflow:visible !important;border-radius:8px;}
    .mygoal .progress{background:#eccedb;height:9px;overflow:visible;}
    `}</style>
    <div className='box mygoal rounded-lg mb-4 shadow-voilet border p-0'>
      <div className='border-bottom border-voilet' >
        <h2 className='text-large   font-GillSans text-uppercase lightpink p-3 goaltitle'>{goal?.name || 'MY PIGGY BANK'}</h2>
      </div>
      <div className='p-3' >
        <p className='mb-3 '>Total Earnings</p>
        {/* {goal.days ? <p className='mb-3 text-voilet '>{goal.days > 1 ? `${goal.days} Days` : `${goal.days} Day`} left to goal ends.</p> : ''} */}
        <ProgressBar now={goal?.fullfilled}  max={goal?.target} />
        <p className='text-muted text-small mt-2' >{getPercentage(goal?.target, goal?.fullfilled)}% of {formatMultiPrice(goal?.target, goal?.currency)} goal.</p>
      </div>
    </div>
    </>
  )
}
