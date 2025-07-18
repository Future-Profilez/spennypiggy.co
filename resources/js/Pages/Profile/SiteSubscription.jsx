import React from 'react';
import { Link } from "@inertiajs/react";

export default function SiteSubscription({charges}) {
  return (
    <>
      <div className="w-full finishs mb-4 rounded-3xl bg-white !border-voilet  shadow-voilet  ">
            <div className='border-bottom border-voilet ' >
                <h2 className='text-large font-GillSans text-uppercase   p-3 goaltitle text-white btn-shadow pinkbg'>Subscription Status</h2>
            </div>
            <div className='p-4'>
                <p className={`mb-4 text-[17px] text-center text-gray-700`}>
                     Enjoy a <span className='text-green-700 font-bold text-lg uppercase'>3-days free trial</span> before your monthly subscription begins! Stripe charges £2 a month for this service, and we add a £2 administrator charge due to heightened compliance requirements.
                </p>
                <Link href="/activate-subscription" className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 3 transition-all duration-200" >
                    Start Free Trial
                </Link>
            </div>
        </div>
    </>
  );
}
