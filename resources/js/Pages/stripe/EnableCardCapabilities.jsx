import { Link } from "@inertiajs/react";
import { useState } from "react";

export default function EnableCardCapabilities({charges}) {

    const [loading, setLoading] = useState(false);
  return (
    <>
        <div className="w-full finishs  mb-4 rounded-3xl bg-white !border-voilet  shadow-voilet  ">
            <div className='border-bottom border-voilet' >
                <h2 className='text-large font-GillSans text-uppercase lightpink p-3 goaltitle'>Action Required</h2>
            </div>
            <div className='p-4'>
                <p className={`mb-4 text-md text-red-600`}>
                Your Stripe account is not fully enabled. Please click below to complete the Stripe onboarding and enable payments.</p>
                <Link onClick={() => setLoading(!loading)}
                href="/stripe/enable_card_payments"
                className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 3 transition-all duration-200"
                >{loading ? "Loading..." : "Enable Card Payments"} </Link>
            </div>
        </div>
    </>
  );
}
