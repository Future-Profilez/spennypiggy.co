import React from 'react'
import { Link, Head } from "@inertiajs/react";
import addwishlistimg from "../../../assets/img/addwishlistimg.png";
import TrustBox from './TrustBox';

export default function Hero({auth}) {
  return <>
     
   <div className="heroSec">
   <div className="containerbox">
       <div className="welcome">
           <div className="welcomeLeft">
               <h2 className="d-none d-md-block  welcomeHeading shadow-yellow font-GillSans text-uppercase mb-1">
                  Oink! Oink! <br /> B*tch{" "}
               </h2>
               <h3 className="welcomeTitle shadow-yellow text-uppercase font-GillSans mb-2">
                   Get Your Lifestyle funded! 🎁
               </h3>
               <div className="mt-2 pt-2 wishlistbtn wishlistbtnFixed ">
                  {auth?.user?.username ?  <Link href={`/${auth && auth?.user && auth?.user?.username || ''}`} className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint log" > My Wishlist </Link>
                    : <Link href="/register" className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint" > Create Wishlist </Link> }
               </div>
               <div className="mt-4 pt-2 gifts-links text-white ps-0 ">
                With Financial Gifts, Donations, Memberships & More! 🤑
               </div>

               <div className="itsfree ps-0 mt-0 mt-md-3 pt-1 text-start"> Its’s Free 🎉 </div>
               

               <div className='d-flex d-md-none justify-content-center' >  
                 <TrustBox />
                </div>

           </div>
           <div className="welcomeRt">

                <h2 className="d-block d-md-none welcomeHeading shadow-yellow font-GillSans text-uppercase mb-1">
                  Oink! Oink! <br /> B*tch{" "}
               </h2>

               <img alt={"image"} 
               height={377.63}
               src={addwishlistimg} 
               width={474} />


              <div className="proudlines mt-3 mt-md-0 mb-0 welcomeTitle sm text-center mt-1 shadow-yellow text-uppercase font-GillSans ps-0 ">
                Proudly 🏳️‍🌈 Owned
              </div>

              <div className='d-none d-md-flex justify-content-center' >  
                  <TrustBox />
              </div>
           </div>
       </div>
   </div>
</div>
</>
}
