import { useEffect, useState } from "react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import next from '../../../assets/img/comingnext.png';
import { FaTruck, FaGift, FaLock, FaRocket } from 'react-icons/fa';

export default function ComingNext() {
  return (
   <div className="bg-black py-16 md:py-24 relative overflow-hidden">
       {/* Decorative Background Elements */}
       <div className="absolute top-0 right-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/4 right-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

      <div className="containerbox relative z-10" >
         <div className="flex flex-col lg:flex-row items-center gap-12" >
            <div className='w-full lg:w-1/2' >
               <div className='nextimage-wrap relative group' >
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-yellow-500 rounded-3xl transform rotate-3 scale-105 opacity-70 blur-lg group-hover:rotate-6 transition-all duration-500"></div>
                  <div className="relative rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
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
                    <span className="bg-pink-500 text-white font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                        Coming Soon
                    </span>
               </div>
               <h2 className="text-2xl md:text-4xl lg:text-5xl font-gulfs text-white mb-8 uppercase leading-tight"> 
                    Get ready for <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500">Next Level</span>
               </h2>
               
                <ul className="space-y-6">
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'> 
                        <div className="bg-gray-800 p-3 rounded-full text-yellow-400 shadow-lg mt-1">
                            <FaTruck />
                        </div>
                        <span>Gifts shipped directly to your door!</span>
                   </li>
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'>
                        <div className="bg-gray-800 p-3 rounded-full text-pink-400 shadow-lg mt-1">
                            <FaGift />
                        </div>
                        <span>Receive physical Gifts from Fans</span>
                   </li>
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'>
                        <div className="bg-gray-800 p-3 rounded-full text-purple-400 shadow-lg mt-1">
                            <FaLock />
                        </div>
                        <span>No physical Information is shared! All data is secured by TLS (SSL) 256-bit encryption</span> 
                   </li>
                   <li className='flex items-start gap-4 text-xl md:text-2xl text-gray-300 font-medium'>
                        <div className="bg-gray-800 p-3 rounded-full text-green-400 shadow-lg mt-1">
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
