import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import PriceFormat from '@/includes/PriceFormat';

export default function MyGoal({goal}) {
  const { formatMultiPrice } = PriceFormat();
  const getPercentage = (actual, paid) => {
    const r = (paid/actual)*100;
    return r.toFixed(2);
  }

  return (
    <div className='box rounded-lg mb-4  shadow-voilet border p-4'>
      <h2 className='text-large font-semibold mb-2'>{goal?.name || ''}</h2>
      <p className='mb-3 '>{ goal?.description || ''}</p>
      {goal.days ? <p className='mb-3 text-voilet '>{goal.days > 1 ? `${goal.days} Days` : `${goal.days} Day`} left to goal ends.</p> : ''}
      <ProgressBar now={goal?.fullfilled} max={goal?.target} />
      <p className='text-muted text-small mt-1' >{getPercentage(goal?.target, goal?.fullfilled)}% of {formatMultiPrice(goal?.target, goal?.currency)} goal.</p>
    </div>
  )
}
