import LiveBar from '@/includes/LiveBar'
import React from 'react'
import spennys from "../../../assets/img/spennys.png";
import instagram from '../../../assets/img/instagram.png'
import youtube from '../../../assets/img/youtube.png'
import twitch from '../../../assets/img/twitch.png'
import tiktok from '../../../assets/img/tiktok.png'
import x from '../../../assets/img/x.png'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import Lightbox from '../../includes/Lightbox'
import HeroWishlistImage from '../../../assets/new/HeroWishlist.png';

export default function LiveBarSection() {
  return (

    <div className='bg-black pt-4 mb-24'>
      <img
      className='w-full h-auto'
      src={HeroWishlistImage}
      alt="Wishlist image"
      />
    <p className='uppercase text-center mt-1.5 text-white font-poppins text-[10px] xl:text-[15px]'>*3 days Free trial and then requires a monthly £4 payment to cover stripe fees and compliance costs. </p>
    {/* <div className='flex flex-wrap justify-content-center mt-4 items-center creators-platforms' >
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}

            effect="blur"

            className=""
            src={tiktok}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}

            effect="blur"

            className=""
            src={x}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}

            effect="blur"

            className=""
            src={youtube}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}

            effect="blur"

            className=""
            src={instagram}
            width={190}
          />
        </div>
        <div data-aos="zoom-in" className='px-4 py-2' >
          <LazyLoadImage
            alt={"image"}

            effect="blur"

            className=""
            src={twitch}
            width={190}
          />
        </div>
    </div> */}

    <div className='w-100 livebarsections-hidden '>
      <div className=' livebarsections pt-0 pt-md-5 mt-4 '>
        <div className='container px-4 w-100' >
          <h2 className='headingSm shadow-none text-light stroke-none text-center text-4xl md:text-5xl mb-1 pt-4 pt-lg-0' >What is spenny Piggy ? 🐷</h2>

           <Lightbox classes="m-auto d-table" text={<>
              <div data-aos="zoom-out" className="videoBg w-100 mt-3 rounded-5 shadow-mint" >
                <img alt={"image"}  className='rounded-5 shadow-mint' src={spennys} />
              </div>
           </>
           } images={[ { src: spennys }]} />


           {/* <div className='shadow-voilet rounded-5 mt-5 bg-white max-w-[600px] mx-auto px-6 py-[80px]'  >
            <h2 className='headingSm shadow-none text-dark text-3xl stroke-none text-center' >New Video Coming Soon*</h2>
           </div> */}

           {/* <p className='text-center mt-4' >*all transactions provide exclusive content or member only access.</p> */}

        </div>
        {/* <LiveBar classes={'barouter mt-2 mt-md-5 pt-4'} text={"💰⚡ Fast & Easy payments through: Apple pay, Cashapp Pay "} /> */}
      </div>
    </div>
    </div>
  )
}
