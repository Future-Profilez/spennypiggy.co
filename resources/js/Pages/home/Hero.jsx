import React from 'react'
import { Link, Head } from "@inertiajs/react";
import addwishlistimg from "../../../assets/img/addwishlistimg.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import TrustBox from './TrustBox';

export default function Hero({auth}) {
  return <>
     
   <div className="heroSec">
   <div className="containerbox">
       <div className="welcome">
           <div className="welcomeLeft">
               <h2 className="welcomeHeading shadow-yellow font-GillSans text-uppercase mb-1">
                  Oink! Oink! <br /> B*tch{" "}
               </h2>

               <div className="proudlines welcomeTitle mt-4 shadow-yellow text-uppercase font-GillSans mt-2 ps-0 ">
                Proudly 🏳️‍🌈 Owned and Operated
               </div>
               <h3 className="welcomeTitle shadow-yellow text-uppercase font-GillSans mb-2">
                   Get Your Lifestyle funded! 🎁
               </h3>
               <div className="itsfree mb-4 pb-2 ps-0 text-start">
               Its’s Free 🎉
               </div>

               
               <div className="mt-4 pt-2 wishlistbtn wishlistbtnFixed ">
                  {auth?.user?.username ? 
                  <Link href={`/${auth && auth?.user && auth?.user?.username || ''}`} className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint log" > My Wishlist </Link>
                  :  <Link href="/register" className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint" > Create Wishlist </Link>
                  }
               </div>
              
           </div>
           <div className="welcomeRt">
               <img
               alt={"image"} 
               height={377.63}
               src={addwishlistimg} 
               width={474} />

                <div className='d-flex justify-content-center' >  
                <TrustBox />
                </div>
              

           </div>
       </div>
   </div>
</div>
</>
}
