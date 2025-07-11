import React from 'react';
import { Link } from "@inertiajs/react";

export default function SiteSubscription({charges}) {
  return (
    <>
      <div className="w-full finish mt-4 p-4 mb-4  rounded-2xl bg-white border-2 !border-black shadow-voilet  ">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">
            Subscription Status
        </h2>
        <p className={`mb-4 text-sm ${charges ? 'text-gray-700' : 'text-red-600'}`}>
            {charges
            ? "✅ Your subscription is active. Stripe charges £2/month and we add a £2 admin fee due to compliance requirements."
            : "⚠️ You do not have an active subscription. Stripe charges £2/month plus a £2 admin fee for compliance. Please activate your subscription to continue using this service."}
        </p>
        {charges ? (
            <button
            disabled
            className="w-full bg-green-50 text-green-700 font-medium border border-green-600 px-4 py-2 rounded-xl cursor-not-allowed"
            >
            ✅ Subscription Active
            </button>
        ) : (
            <Link
            href="/activate-subscription"
            className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 rounded-2xl transition-all duration-200"
            >
            Activate Subscription
            </Link>
        )}
        </div>
    </>
  );
}
