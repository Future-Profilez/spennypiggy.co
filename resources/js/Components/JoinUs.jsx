import React from 'react'
import { Link } from '@inertiajs/react';
export default function JoinUs() {
  return <>
    <div className="joinus blackbg ">
                    <h2 className="headingMd shadow-yellow mb-3 text-center mb-6 ">
                        Join thousands of creators
                    </h2>
                    <p className="text-CeraGR mb-6 text-center mb-16 font-CeraGRBold text-wh mb-5">
                        Create your wishlist and start receiving gift's from your
                        fans right away!
                    </p>
                    <div className="1text-center rotate-btn text-center flex items-center  justify-center content-center w-full">
                        <Link href={route("register")}
                            className="btn-pink lg w-80 shadow-mint border-mint mb-4 mb-lg-0" >Join SpennyPiggy </Link>
                    </div>
                </div>
                </>
}
