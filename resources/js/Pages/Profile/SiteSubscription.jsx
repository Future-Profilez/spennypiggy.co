import React from 'react'
import { Link } from "@inertiajs/react";

export default function SiteSubscription() {
  return (
    <>
      <div className="finish mt-4 d-block">
          <p className="mb-4 px-5"> Set up <strong>Mandatory Subscription</strong> of £4 to activate stripe payments.</p>
          <Link href={"/stripe-subscription"} className="btn-pink border-black shadow-black text-xs lg" >Activate Subscription</Link>
      </div> 
    </>
  )
}
