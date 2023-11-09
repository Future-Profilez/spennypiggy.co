import React from 'react';
import noresultimg from '../../assets/img/noresultimg.png' ;
import { Link } from '@inertiajs/react';

export default function Nocontent({error}) {
  return (
    <div className='noResult flex justify-center items-center content-center flex-wrap p-4 blackbg'>
        <div className='noresultimg mb-5'><img src={noresultimg} /></div>    
        <h2 className='headingLg w-full text-center shadow-yellow mb-5'>No Result Found </h2>
        {error ? <div className='rotate-btn'>
            <Link  to="/" className="btn-pink md w-52 border-mint shadow-mint">Back to Home</Link>
        </div> : ''}
    </div>
  )
}
