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

export default function LiveBarSection() {
  return (

    <div className='lightpink-50 pt-4'>

    <p className='text-uppercase pt-3 pt-md-5  text-center' >Built for creators of all platforms </p>
    <div className='d-flex flex-wrap justify-content-center mt-4 align-items-center creators-platforms' >
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

    <div className='w-100 livebarsections-hidden '>
      <div className=' livebarsections pt-0 pt-md-5 mt-4 '>
        <div className='container px-4 w-100' >
          <h2 className='headingSm shadow-none text-dark stroke-none text-center mb-3 pt-4 pt-lg-0  ' >What is spenny Piggy ?</h2>
          
           <Lightbox classes="m-auto d-table" text={<>
              <div data-aos="zoom-out" className="videoBg w-100 mt-5 rounded-5 shadow-voilet" >
                <img alt={"image"}  className='rounded-5 shadow-voilet' src={spennys} />
              </div>
           </>
           } images={[ { src: spennys }]} />
           

           {/* <div className='shadow-voilet rounded-5 mt-5 bg-white max-w-[600px] mx-auto px-6 py-[80px]'  >
            <h2 className='headingSm shadow-none text-dark text-3xl stroke-none text-center' >New Video Coming Soon*</h2>
           </div> */}

           <p className='text-center mt-4' >*all transactions provide exclusive content or member only access.</p>

        </div>
        <LiveBar classes={'barouter mt-2 mt-md-5 pt-4'} text={"💰⚡ Fast & Easy payments through: Apple pay, Cashapp Pay "} />
      </div>
    </div>
    </div>
  )
}
