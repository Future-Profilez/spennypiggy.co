
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Link, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import userphoto from "../../../assets/siteicon.png";

export default function Thankyou(props) {

  const {owner} = props;
  const { global_currency, auth, user } = usePage().props;

    return (
        <Authenticated auth={auth.user} user={user} >
            <Head title={"Thankyou"} />
            <style>{`
            .thankyou-wrap { min-height:89vh; }
            .giftthank {
              border:2px dashed var(--mint);
            }
            `}</style>

             <div className='p-4 text-center text-mint thankyou-wrap flex justify-center items-center'>
              <div className='max-w-[500px]'>
                <h2 className='text-[25px] ' >Your gift has been sent.</h2>
                <p className='pt-2 pb-4' >Check your email for a receipt.</p>
                <div className='giftthank p-4' >
                  <p>Thank you from Spenny Piggy on behalf of {owner && owner.name}.</p>

                    <div className="avatar rounded-[50%] w-20 h-20 overflow-hidden mx-auto block mt-4 " >
                          <LazyLoadImage
                          src={owner.avatar_url || userphoto}
                          alt="image-avatar" className="img-fluid rounded w-full h-full object-cover"  effect="blur"
                          height={100}
                          width={100} />
                    </div>

                  <div className='w-full mt-2' >
                    <Link href={`/${owner && owner.username}`} className='underline' >
                        visit @{owner && owner.username}'s wishlist
                    </Link>
                  </div>
                </div>

                <p className='py-6 text-center px-6'>Please create an account to see the content you have purchased.</p>
                <div className='w-full mt-4' >
                  {auth && auth.user ?
                      <Link className='button lg mt-4' href={`/${owner && owner.username}`}>
                        Back to profile
                      </Link>
                    :
                    <Link className='button  mt-4' href={route("register")}>
                      Create a Gifter account
                    </Link>
                  }
                </div>
              </div>
             </div>
        </Authenticated>
    )
}
