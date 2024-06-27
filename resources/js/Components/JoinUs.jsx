import React from 'react'
import { Link } from '@inertiajs/react';
export default function JoinUs() {
  return <>
    <div className="joinus blackbg ">
        <h2 data-aos="zoom-out-up" className="headingSm shadow-none stroke-none mb-3 text-center mb-6 ">
            Join thousands of creators
        </h2>
        <p data-aos="zoom-out-up" className=" mb-6 text-center mb-16 text-wh mb-5">
        Create your wishlist, sell exclusive content or offer bespoke memberships! Whatever it is, start accepting support instantly!
        </p>
        <div data-aos="zoom-out-up" className=" text-center flex items-center  justify-center content-center w-full"> 
            <Link href={route("register")}
                className="btn-pink lg w-80 shadow-mint border-mint mb-4 mb-lg-0" >Join Spenny Piggy </Link>
        </div>
    </div>
    </>
}
