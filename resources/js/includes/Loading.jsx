import React from 'react';
import loading from '../../assets/img/loading.gif';

export default function Loading({error, text}) {
  return (
    <div className='loadingwrap  flex justify-center items-center content-center flex-wrap p-4  '>
        <div className='noresultimg mb-3'><img src={loading} /></div>    
        <h6 className='headingLg loadingtext w-full text-center shadow-yellow mb-5'>Loading...</h6>
    </div>
  )
}
