import React from 'react'
import payoutimg from "../../../assets/img/payoutimg.png";
import fraudprotecicon from "../../../assets/img/fraudprotecicon.png";
import twowayicon from "../../../assets/img/twowayicon.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function WhyLove() {

   const features = [
      {
         title :"100% payout",
         heading: "Currency conversion may reduce the amount. (UK / US 100% guaranteed!)",
      },
      {
         title :"Profile Tip Jar ",
         heading: "For collecting those coins in record time!",
      },
      {
         title :"Video Thank You’s",
         heading: "Send a truly custom message your fans will cherish forever!",
      },
      {
         title :"⁠Reimbursements⁠",
         heading: "Not just wishes! Get those Bills paid too!",
      },
      {
         title :"⁠Memberships ",
         heading: "Four tier options for your most deserving fans.",
      },
      {
         title :"Data Heaven ",
         heading: "Useful insights to adapt your page.",
      },
      {
         title :"Intro video ",
         heading: "Showcase a profile introduction video, making your page as unique as you are!",
      },
      {
         title :"The Leaderboard  ",
         heading: "Showcase your fans support directly on your page and site wide.",
      },
      {
         title :"Referrals  ",
         heading: "Secure an extra 5% of other creators donations for life!",
      },
      {
         title :"Seek & Search ",
         heading: "For fans to discover wishes and new creators to support!",
      },
      {
         title :"Fraud protection  ",
         heading: "Your earnings are secure with us; we've got your back.",
      },
      {
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
                        src={`/features/${i+1}.png`}
                        width={70} />
                     </div>
                     <h3 className="headingSm text-shadow-black text-mint">{item.title}</h3>
                     <p className="text-dark">{item.heading}</p>
               </div>
            })}


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
