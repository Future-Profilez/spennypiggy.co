import React from 'react'
import image1 from "../../../assets/features/1.png";
import image2 from "../../../assets/features/2.png";
import image3 from "../../../assets/features/3.png";
import image4 from "../../../assets/features/4.png";
import image5 from "../../../assets/features/5.png";
import image6 from "../../../assets/features/6.png";
import image7 from "../../../assets/features/7.png";
import image8 from "../../../assets/features/8.png";
import image9 from "../../../assets/features/9.png";
import image10 from "../../../assets/features/10.png";
import image11 from "../../../assets/features/11.png";
import icon1 from "../../../assets/features/icon1.png";
import icon2 from "../../../assets/features/icon2.png";
import icon3 from "../../../assets/features/icon3.png";

import image12 from "../../../assets/features/12.png";

import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function WhyLove() {

   const features = [
      {
         icon:image1,
         title :"100% payout",
         heading: "Currency conversion may reduce the amount. (UK / US 100% guaranteed!)",
      },
      {
         icon:image2,
         title :"Profile Tip Jar ",
         heading: "For collecting those coins in record time!",
      },
      {
         icon:image3,
         title :"Video Thank You’s",
         heading: "Send a truly custom message your fans will cherish forever!",
      },
      {
         icon:image4,
         title :"⁠Reimburse - ments⁠",
         heading: "Not just wishes! Get those Bills paid too!",
      },
      {
         icon:image5,
         title :"⁠Member - ships ",
         heading: "Four tier options for your most deserving fans.",
      },
      {
         icon:image6,
         title :"Data Heaven ",
         heading: "Useful insights to adapt your page.",
      },
      {
         icon:image7,
         title :"Intro video ",
         heading: "Showcase a profile introduction video, making your page as unique as you are!",
      },
      {
         icon:image8,
         title :"The Leaderboard  ",
         heading: "Showcase your fans support directly on your page and site wide.",
      },
      {
         icon:image9,
         title :"Referrals  ",
         heading: "Secure an extra 5% of other creators donations for life!",
      },
      {
         icon:image10,
         title :"Seek & Search ",
         heading: "For fans to discover wishes and new creators to support!",
      },
      {
         icon:image11,
         title :"Fraud protection  ",
         heading: "Your earnings are secure with us; we've got your back.",
      },
      {
         icon:image12,
         title :"Remain Anonymous  ",
         heading: "Privacy for both fans and creators – because discretion matters.",
      },
   ];

  return (
   <div className="whylove whbg">
      <div className="containerbox">
         <div className="whylovebox">
            <h2 className="headingMd text-shadow-black text-mint text-center w-full mb-4">
                  Why we love <br /> Spenny piggy
            </h2>
            {features && features.map((item, i)=>{
               return <div className="loveboxes px-4 mt-4  mb-4">
                     <div className='featureicon' >
                        <LazyLoadImage
                        alt={"image"}
                        height={70} useIntersectionObserver={true} effect="blur"
                        src={item.icon}
                        width={70} />
                        {/* {{URL::asset('/features/${i+1}.png')}} */}
                     </div>
                     <h3 className="headingSm text-shadow-black text-mint">{item.title}</h3>
                     <p className="text-dark">{item.heading}</p>
               </div>
            })}



            <div className='row mt-4 w-100 mb-4 mb-md-0' >
               <div className='col-xl-4 col-sm-6' >
                  <div className="box rounded-md infobox shadow-voilet mt-4 text-center">
                        <div className='new-icon mt-2' >
                           <LazyLoadImage
                           alt={"image"} 
                           height={70} useIntersectionObserver={true} 
                           effect="blur" 
                           src={icon1}
                           width={70} />
                        </div>
                        <h3 className="headingSm text-shadow-black text-mint mt-3">by fans</h3>
                        <p className="text-dark">Paid for by fans</p>
                  </div>
               </div>

               <div className='col-xl-4 col-sm-6' >
                  <div className="box rounded-md infobox shadow-voilet mt-4 text-center">
                        <div className='new-icon mt-2' >
                           <LazyLoadImage
                           alt={"image"} 
                           height={70} useIntersectionObserver={true} 
                           effect="blur" 
                           src={icon2}
                           width={70} />
                        </div>
                        <h3 className="headingSm text-shadow-black text-mint mt-3">Fees</h3>
                        <p className="text-dark">From only 8% Fees! Creators keep 100%*🥳</p>
                  </div>
               </div>
               
               <div className='col-xl-4' >
                  <div className="box rounded-md infobox shadow-voilet mt-4 text-center">
                        <div className='new-icon mt-2' >
                           <LazyLoadImage
                           alt={"image"} 
                           height={70} useIntersectionObserver={true} 
                           effect="blur" 
                           src={icon3}
                           width={70} />
                        </div>
                        <h3 className="headingSm text-shadow-black text-mint mt-3">Conversion</h3>
                        <p className="text-dark">Currency conversions will affect some creators. UK and US always receive 100%</p>
                  </div>
               </div>
               
            </div>


            {/* <div className="loveboxes px-4">
                  <LazyLoadImage
                  alt={"image"}
                  height={"auto"} useIntersectionObserver={true} effect="blur"
                  src={payoutimg}
                  width={"auto"} />
                  <h3 className="headingSm text-shadow-black text-mint">
                     100% payout
                  </h3>
                  <p className="text-wh">
                  Non UK creators may receive a reduced or increased payout due to currency conversions.
                  </p>
            </div>

            <div className="loveboxes px-4">
                  <LazyLoadImage
                  alt={"image"} useIntersectionObserver={true} effect="blur"
                  height={"auto"}
                  src={fraudprotecicon}
                  width={"auto"} />
                  <h3 className="headingSm text-shadow-black text-mint">
                     Fraud <br /> protection
                  </h3>
                  <p className="text-wh">
                     Your earnings are secure with us; we've got
                     your back.
                  </p>
            </div>

            <div className="loveboxes px-4">
                  <LazyLoadImage
                  alt={"image"}
                  height={"auto"} useIntersectionObserver={true} effect="blur"
                  src={twowayicon}
                  width={"auto"} />
                  <h3 className="headingSm text-shadow-black text-mint">
                     Two way <br /> anonymity
                  </h3>
                  <p className="text-wh">
                     Privacy for both fans and creators - because
                     discretion matters.
                  </p>
            </div> */}
         </div>
      </div>
   </div>
  )
}
