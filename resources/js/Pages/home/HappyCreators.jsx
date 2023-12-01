import React, { useEffect, useState } from 'react'
import 'swiper/css';
import 'swiper/css/pagination';
import {  Pagination  } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

export default function HappyCreators() {

   const [width, setWidth] = useState(window && window.innerWidth);
   function windowWidth() {
       const w = window && window.innerWidth;
       setWidth(w);
   }
   useEffect(() => {
       window.addEventListener("resize", windowWidth);
   }, []);

   const msg = [
      {
        "id": 1,
        "date":'Nov 12, 2023, 04:00 pm',
        "name": "Titch_dnb",
        "message": "Honestly, this site has been a game changer for me! I’ve been able to get new decks and keep creating the music I love! All thanks to my fans and anonymous gifts I’ve received!"
      },
      {
        "id": 2,
        "name": "ysheeblack",
        "date":'Oct 26, 2023, 05:35 pm',
        "message": "Girl… I never leave reviews but trust and believe this site is the goat! I’ve been able to upgrade my looks and put on such elevated shows! All thanks to my fans who love me! I didn’t realize how much! And I keep all the cash! Honestly, it’s crazy!"
      },
      {
        "id": 3,
        "name": "legitjustjack",
        "date":'Nov 15, 2023, 04:15 am',
        "message": "I honestly didn’t realize how much I needed spenny piggy in my life! I’ve had loads of gifts funded already and from random strangers! I didn’t realize how easy and simple it could be to get support from my fans!"
      },
      {
        "id": 4,
        "name": "mattangove",
        "date":'Nov 08, 2023, 11:45 pm',
        "message": "Getting to keep everything I earn has been crazy next level! This site has been key in supporting me and my goals!! Genuinely so so impressed! And it’s sexy AF to look at too! x"
      }
    ]

  return (
   <div className="happycreator mintbg">
   <div className="containerbox">
       <h2 className="headingMd text-shadow-black text-pink text-center mb-10">
           Happy Creators
       </h2>
       <div className="creatorslider">
           <Swiper spaceBetween={0}
               pagination={{ clickable: true }}
               modules={[Pagination]}
               slidesPerView={width < "1199" ? 1 : 3} >
               {msg && msg.map((m , i)=>{ 
                   return <SwiperSlide key={`swiper-item-${i}`} >
                           <div className="happyclientSec">
                               {/* <div className="clientdetail">
                                   <img src={userimg} alt />
                                   <div className="clientname">
                                       <strong className="font-CeraGRBold">
                                           Dave Turner
                                       </strong>
                                       @DaveTheRave
                                   </div>
                               </div> */}
                               <div className="clientdetail">
                                   <div className="clientname ps-0">
                                       <strong className="font-CeraGRBold">
                                           @{m.name}
                                       </strong>
                                   </div>
                               </div>
                               <p>
                               {m.message}
                               </p>
                               <div className="postdate">
                                  {m.date}
                               </div>
                           </div>
                   </SwiperSlide>
               })}
           </Swiper>
       </div>
   </div>
</div>
  )
}
