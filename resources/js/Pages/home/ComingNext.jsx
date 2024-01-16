import React, { useEffect, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import next from '../../../assets/img/comingnext.png';

export default function ComingNext() {
  return (
   <div className="comming-next mintbg" >
      <div className="containerbox py-5" >
         <div className="row align-items-center " >
            <div className='col-lg-6 ' >
               <div className='nextimage-wrap mb-4 mb-lg-0' >
                     <LazyLoadImage
                     alt={"image"} useIntersectionObserver={true} effect="blur"
                     height={"auto"}
                     src={next}
                     width={"auto"} />
               </div>
            </div>
            <div className='col-lg-6' >
               <h2 className="headingMd text-shadow-black text-pink mb-10"> Get ready for </h2>
            <ul>
               <li className='mt-3 text-large'> 🚚 Gifts shipped directly to your door! </li>
               <li className='mt-3 text-large'>🎁 Receive physical Gifts from Fans</li>
               <li className='mt-3 text-large'>🔐 No physical Information is shared to the fans! All data is secured by TLS (SSL) 256-bit encryption </li>
               <li className='mt-3 text-large'>🚀 We order and ship for you!</li>
            </ul>
            </div>
         </div>
      </div>
   </div>
  )
}
