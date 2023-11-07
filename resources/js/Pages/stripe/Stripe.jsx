import Authenticated from '@/Layouts/AuthenticatedLayout'
import React from 'react'

export default function Stripe() {
  return (
    <Authenticated>
    <div className='stripbox mx-auto border-mint whbg shadow-mint rounded-3xl pb-20'>
        <div className='loginheadbox pinkbg'>
            <span className='mintbg'></span>
            <span className='bluebg'></span>
        </div>
        <div className='stripNote p-8'>
            <h3 className='font-GillSans mb-2 text-uppercase'>A note to our SW and NSFW content creators</h3>
            <p className='mb-4'>You are about to go to a 3rd party site, Stripe.com where you will enter your private payment information.
              Do not put any external business links on your Stripe account.
              We've set your business url on Stripe to Spenny Piggy.com. Do not change this link.
              Stripe allows adult content creators to use Spenny Piggy to process gifts within our terms of service.
              Reach out to us if Stripe attempts to shut your account down at any point. We can help you retain it. Reaching out to us will also help prevent shutdowns for future users and improve Spenny Piggy for everyone.</p>
        <div className='termselect'>
        <label for="termaccept">
            <input type="checkbox" id="termaccept" name="termaccept" value="termaccept"></input>
            I will only use Spenny Piggy to receive gifts, tips and donations. I will not sell services or goods on my wishlist.
        </label>
        </div>
        </div>
        <div class="wishlistbtn text-center flex justify-center mt-10"><a class="btn-pink lg w-1/2" href="/">Go to Stripe Setup</a></div>
    </div>
    </Authenticated>
  )
}
