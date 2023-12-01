import React from 'react'
import sharewishimg01 from "../../../assets/img/sharewishimg01.png";
import receivegiftimg from "../../../assets/img/receivegiftimg.png";
import thankfansimg from "../../../assets/img/thankfansimg.png";
export default function FunPart() {
  return (
   <div className="funpart">
   <div className="containerbox">
       <h2 className="headingMd text-shadow-black">
           let’s dive into <br /> the fun part{" "}
       </h2>
       <div className="funboxs mintbg shadow-black border-black mb-10">
           <div className="funboximg">
               <img src={sharewishimg01} alt="img" />
           </div>

           <div className="funcnt">
               <h3 className="headingSm text-shadow-black mb-3">
                   Create & share <br /> your Wishlist
               </h3>
               <p className="text-CeraGR">
                   Join Spenny Piggy, add items to your
                   Wishlist and start sharing your page just in
                   minutes!
               </p>
           </div>
       </div>

       <div className="funboxs pinkbg shadow-black border-black mb-10">
           <div className="funcnt">
               <h3 className="headingSm text-shadow-black mb-3 text-purple">
                   Receive gifts <br /> from your fans
               </h3>
               <p className="text-CeraGR text-wh">
                   Cash Gift, Secret Gift, Surprise Gift,
                   Crowdfunding Gifts! There are many ways your
                   fans can support you on Spenny Piggy
               </p>
           </div>
           <div className="funboximg">
               <img src={receivegiftimg} alt="img" />
           </div>
       </div>

       <div className="funboxs bluebg shadow-black border-black mb-10">
           <div className="funboximg">
               <img src={thankfansimg} alt="img" />
           </div>

           <div className="funcnt">
               <h3 className="headingSm text-shadow-black mb-3 text-pink">
                   Thank your <br /> fans!
               </h3>
               <p className="text-CeraGR text-wh">
                   Showcase your gift with a shout-out on your
                   socials or thank your fans directly on
                   Spenny Piggy via a personal text or video
                   message.
               </p>
           </div>
       </div>
   </div>
</div>

)
}
