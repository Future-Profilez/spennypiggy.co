import React from 'react'
import { usePage } from '@inertiajs/react';
import GifterItems from './GifterItems';
import GifterTips from './GifterTips';
import GifterSubscriptions from './GifterSubscriptions';
import GifterMembership from './GifterMembership';
import { Link } from "@inertiajs/react";
 



export default function Gifter({ IsloggedIn }){

  const { auth, user, username, global_currency, itemid, min_surprise_amount  } = usePage().props;

  


  return (
    <>
      <div className="row about-sec " >
        
        <div className="col-md-5" >
            <div className={`${user && !user.bio ? "d-nones":""} box shadow-voilet rounded-lg mb-4`} >
                <p className="font-bold" >About me</p>
                <p className={`text-muted text-start mt-2 `}>
                    {(user && user.bio) || ""}
                </p>
            </div>
            <GifterTips />
            <GifterMembership />
        </div>

        <div className="col-md-7" >
          {IsloggedIn ? <div className="finish mb-4 mt-0 d-block">
              <p className="mb-4"> Finish setting up your account to receive funds. You have more steps to complete your payment setup. </p>
              <Link href={"/stripe"} className="btn-pink lg" >
                  Become a creator
              </Link>
          </div> : ''}

          <GifterItems IsloggedIn={IsloggedIn} />

          {/* <GifterSubscriptions /> */}
          {/* {IsloggedIn ? <ThankyouMessages /> : ''} */}

        </div> 

      </div>
    </>
  )
}
