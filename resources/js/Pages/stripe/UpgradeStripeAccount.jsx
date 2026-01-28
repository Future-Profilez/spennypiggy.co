import { Link } from "@inertiajs/react";
import { useState } from "react";

export default function UpgradeStripeAccount() {
    const [loading, setLoading] = useState(false);
  return (
    <>
        <div className="w-full finishs  mb-4 rounded-3xl bg-white !border-voilet  shadow-voilet  ">
            <div className='border-bottom border-voilet' >
                <h2 className='text-large font-GillSans text-uppercase lightpink p-3 goaltitle'>Action Required</h2>
            </div>
            <div className='p-4'>
                <h2 className='text-red-600 text-xl md:text-xl mb-2 font-gulfs uppercase'>Your Stripe Account Needs an Upgrade</h2>
                <p className={`mb-2 text-md text-red-600`}>
                To receive card payments and access full payment features like global subscriptions and payouts, please complete your Stripe account setup.</p>
                <p className={`mb-4 text-md text-red-600`}>
                This is a quick one-time step required by Stripe to meet international compliance and allow you to earn on our platform.</p>
                <Link onClick={() => setLoading(!loading)}
                href="/stripe/upgrade-express-account"
                className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 3 transition-all duration-200"
                >{loading ? "Loading..." : "Upgrade Account"} </Link>
            </div>
        </div>
    </>
  );
}
