import React from 'react';
import { Link } from "@inertiajs/react";

export default function SiteSubscription({charges}) {
  return (
    <>
      <div className="w-full finishs mt-4 mb-4 rounded-3xl bg-white !border-voilet  shadow-voilet  ">
            <div className='border-bottom border-voilet' >
                <h2 className='text-large font-GillSans text-uppercase lightpink p-3 goaltitle'>Subscription Status</h2>
            </div>
            <div className='p-4'>
                <p className={`mb-4 text-[17px] text-center text-gray-700`}>
                    ⚠️ You do not have an active subscription. Stripe charges £2/month plus a £2 admin fee for compliance. Please activate your subscription to continue using this service.
                </p>
                <Link href="/activate-subscription" className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 3 transition-all duration-200" >
                    Activate Subscription
                </Link>
            </div>
        </div>
    </>
  );
}
