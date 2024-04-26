import React from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component';
import image1 from '../../../assets/fea/1.png';
import image2 from '../../../assets/fea/2.png';
import image3 from '../../../assets/fea/3.png';
import image4 from '../../../assets/fea/4.png';
import image5 from '../../../assets/fea/5.png';
import image6 from '../../../assets/fea/6.png';
import image7 from '../../../assets/fea/7.png';
import image8 from '../../../assets/fea/8.png';
import image9 from '../../../assets/fea/9.png';
import image11 from '../../../assets/fea/11.png';
import image12 from '../../../assets/fea/12.png';
import image13 from '../../../assets/fea/13.png';
import cc from '../../../assets/fea/cc.png';

export default function WhyLove() {

   const features = [
      {
         icon:image2,
         title :"Posts",
         heading: "Share your creative journey with blog posts, videos and audio clips.",
      },
      {
         icon:image3,
         title :"rewards",
         heading: "Let Supporters unlock exclusive posts, member-only products and more.",
      },
      {
         icon:image4,
         title :"⁠Commissions & Service",
         heading: "Let Supporters buy unique work or pay for direct access to you.",
      },
      {
         icon:image5,
         title :"Membership tiers",
         heading: "Let fans support you monthly with Spenny Piggy Memberships.",
      },
      {
         icon:image6,
         title :"Supporter-only content ",
         heading: "Make exclusive content available to supporters or members.",
      },
      {
         icon:image7,
         title :"The Leaderboard",
         heading: "Showcase your supporters contributions directly on your page and site wide.",
      },
      {
         icon:image8,
         title :"Profile Intro Video  ",
         heading: "Showcase a profile introduction video, making your page as unique as you are!",
      },
      {
         icon:image9,
         title :"Monthly Bills",
         heading: "Make exclusive content available to supporters or members.",
      },
      {
         hide:true,
         icon:cc,
         title :"Plus much more In the works! 🤩.",
         heading: "",
      } 
   ];


   const premium = [
      {
         icon:image11,
         title :"Link Share Payments",
         heading: "Upload some content, set your price, share the link and get paid! Easy as that!",
      },
      {
         icon:image12,
         title :"Profile Customization",
         heading: "Looking to make your page as unique as you are? Then change some colours, the background or some other aspects to truly stand out. ",
      },
      {
         icon:image13,
         title :"Notify Alerts ",
         heading: "Increase your earnings with each new wish you upload! Now all your previous gifters will receive an e-mail letting them know to check out your page again.",
      }
   ];

  return (
   <>
   <div id='features' className="whylove bluebg">
      <div className="containerbox">
            <h2 className='headingSm shadow-none text-white stroke-none mb-4 text-center mb-6 max-width-1000 m-auto d-table' >Features that you need</h2>
            <div className="whylovebox">
               {features && features.map((item, i)=>{
                  return <div data-aos="flip-down" className={` ${item.hide ? "d-lg-none" : ''}  ${item.hide ? "w-100" : ''}  loveboxes px-4 mt-4  mb-4`}>
                        <div className='featureicon' >
                           <LazyLoadImage
                           alt={"image"}
                           height={70} useIntersectionObserver={true} effect="blur"
                           src={item.icon}
                           width={70} />
                        </div>
                        <h3 className="headingSm mt-2 mb-1 text-shadow-none text-white">{item.title}</h3>
                        <p className="text-white">{item.heading}</p>
                  </div>
               })}
            </div>
      </div>
   </div>
   <div className="whylove yellowbg border-black border-bottom-0 border-end-0 border-start-0">
      <div className="containerbox">
            <h2 className='headingSm shadow-none text-dark stroke-none mb-4 text-center mb-6 max-width-1000 m-auto d-table' >Premium Only Features </h2>
            <div className="whylovebox pre d-block d-lg-flex">
               {premium && premium.map((item, i)=>{
                  return <div className={`loveboxes px-4 mt-4  mb-4`}  data-aos="flip-down">
                        <div className='featureicon' >
                           <LazyLoadImage
                           alt={"image"}
                           height={70} useIntersectionObserver={true} effect="blur"
                           src={item.icon}
                           width={70} />
                        </div>
                        <h3 className="headingSm mt-2 mb-1 text-shadow-none text-dark">{item.title}</h3>
                        <p className="text-dark">{item.heading}</p>
                  </div>
               })}
            </div>
      </div>
   </div>
   </>
  )
}
