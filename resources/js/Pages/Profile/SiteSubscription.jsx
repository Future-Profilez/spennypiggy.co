import React from 'react';
import { Link } from "@inertiajs/react";

export default function SiteSubscription() {
  return (
    <>
      <div className="finish mt-2 d-block">
        <p className="mb-4">
          Unlock full access with a <strong>3-Day Free Trial</strong> subscription of £4/month.
         No charges until the trial period ends.
        </p>
        <Link
          href={"/activate-subscription"}
          className="btn-pink border-black shadow-black text-xs lg" >
          Start 3-Days Free Trial
        </Link>
      </div>
    </>
  );
}
