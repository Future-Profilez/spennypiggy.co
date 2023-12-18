import React from 'react'
import payoutimg from "../../../assets/img/payoutimg.png";
import fraudprotecicon from "../../../assets/img/fraudprotecicon.png";
import twowayicon from "../../../assets/img/twowayicon.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function WhyLove() {
  return (
   <div className="whylove pinkbg">
      <div className="containerbox">
         <div className="whylovebox">
            <h2 className="headingMd text-shadow-black text-mint text-center w-full mb-16">
                  Why we love <br /> Spenny piggy
            </h2>
            <div className="loveboxes px-4">
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
            </div>
         </div>
      </div>
   </div>
  )
}
