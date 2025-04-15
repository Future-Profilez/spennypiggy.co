import React from 'react'
import { Link } from '@inertiajs/react';
import instagram from '../../assets/new/instagram.png'
import youtube from '../../assets/new/youtube.png'
import twitch from '../../assets/new/twitch.png'
import tiktok from '../../assets/new/tiktok.png'
import x from '../../assets/new/x.png'
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function JoinUs() {
  return <>
   <section className="w-full px-4 py-16 bg-black flex flex-col items-center">
   <p className='uppercase pt-3 md:pt-5  text-center text-white text-CeraGR' >Built for creators of all platforms </p>
   <div className="flex flex-wrap justify-center mt-4 mb-20 text-white items-center creators-platforms">
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}
            useIntersectionObserver={true}
            effect="blur"
          
            className=""
            src={tiktok}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}
            useIntersectionObserver={true}
            effect="blur"
          
            className=""
            src={x}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}
            useIntersectionObserver={true}
            effect="blur"
          
            className=""
            src={youtube}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}
            useIntersectionObserver={true}
            effect="blur"
          
            className=""
            src={instagram}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}
            useIntersectionObserver={true}
            effect="blur"
          
            className=""
            src={twitch}
            width={190}
          />
        </div>
    </div>
    <div className="joinus w-full max-w-5xl bg-gradient-to-br from-[#a557ff] to-[#924dff] rounded-3xl p-10 text-center shadow-lg">
        <h2 data-aos="zoom-out-up" className="headingSm font-gulfs text-light shadow-none stroke-none mb-3 text-center mb-6 ">
            What are you waiting for?
        </h2>
        <p data-aos="zoom-out-up" className=" mb-6 text-center mb-16 text-wh text-base mb-5 font-poppins">
        Build your Wishlist, share it with your fans, and get showered with gifts—no waiting, no hassle, just pure love!
        </p>
        <div data-aos="zoom-out-up" className=" text-center flex items-center  justify-center content-center w-full"> 
            <Link href={route("register")}
                className="lg font-anton font-medium uppercase text-xl bg-white rounded-full px-4 py-2 mb-4 mb-lg-0" >Join the Spenny Piggy party! </Link>
        </div>
    </div>
    </section>
    </>
}
