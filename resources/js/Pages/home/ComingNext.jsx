import { useEffect, useState } from "react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import next from '../../../assets/img/comingnext.png';
import { FaTruck, FaGift, FaLock, FaRocket } from 'react-icons/fa';

export default function ComingNext() {
  return (
   <div className="bg-black py-12 md:py-28 relative overflow-hidden">
       {/* Decorative Background Elements */}
       <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/4 right-0 w-64 h-64 bg-[#FF007F] rounded-full mix-blend-screen filter blur-3xl opacity-30 floating-shape"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#FF007F] rounded-full mix-blend-screen filter blur-3xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
        </div>

      <div className="containerbox relative z-10" >
         <div className="flex flex-col lg:flex-row items-center gap-12" >
            <div className='w-full lg:w-1/2' >
               <div className='nextimage-wrap relative group wiggle' >
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-yellow-500 rounded-box transform rotate-3 scale-105 opacity-70 blur-lg group-hover:rotate-6 transition-all duration-500"></div>
                  <div className="relative rounded-box overflow-hidden border-2 border-white/10 group-hover:border-[#FF007F]/50 transition-colors duration-300">
                    <LazyLoadImage
                    alt={"image"}  effect="blur"
                    className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500"
                    src={next}
                    width={"auto"} />
                  </div>
               </div>
            </div>
            <div className='w-full lg:w-1/2' >
               <div className="inline-block mb-4">
                    <span className="bg-[#FF007F] text-white font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full">
                        Coming Soon
                    </span>
               </div>
               <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-white mb-8 uppercase leading-tight"> 
                    Get ready for <br/>
                    <span className="text-gradient-wishlist">Next Level</span>
               </h2>
               
                <ul className="space-y-6">
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'> 
                        <div className="bg-gray-800 p-3 rounded-full text-yellow-400 mt-1">
                            <FaTruck />
                        </div>
                        <span>Gifts shipped directly to your door!</span>
                   </li>
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'>
                        <div className="bg-gray-800 p-3 rounded-full text-[#FF007F] mt-1">
                            <FaGift />
                        </div>
                        <span>Receive physical Gifts from Fans</span>
                   </li>
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'>
                        <div className="bg-gray-800 p-3 rounded-full text-[#05EFB8] mt-1">
                            <FaLock />
                        </div>
                        <span>No physical Information is shared! All data is secured by TLS (SSL) 256-bit encryption</span> 
                   </li>
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'>
                        <div className="bg-gray-800 p-3 rounded-full text-[#05EFB8] mt-1">
                            <FaRocket />
                        </div>
                        <span>We order and ship for you!</span>
                   </li>
                </ul>
            </div>
         </div>
      </div>
   </div>
  )
}
