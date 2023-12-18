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
               <h3 className="welcomeTitle shadow-yellow text-uppercase font-GillSans mb-20">
                   Get Your Lifestyle funded! 🎁
               </h3>
               <div className="mt-6 wishlistbtn wishlistbtnFixed rotate-btn">
                  {auth?.user?.username ? 
                  <Link href={`/${auth && auth?.user && auth?.user?.username || ''}`} className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint log" > My Wishlist </Link>
                  :  <Link href="/register" className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint" > Create Wishlist </Link>
                  }
               </div>
               <div className="itsfree mt-4 ps-24">
                   It’s Free 🎉
               </div>
               <TrustBox />
           </div>
           <div className="welcomeRt">
               <img
               alt={"image"} 
               height={377.63}
               src={addwishlistimg} 
               width={474} />
           </div>
       </div>
   </div>
</div>
</>
}
