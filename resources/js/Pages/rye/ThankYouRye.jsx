
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Link, Head, usePage } from '@inertiajs/react';
import React from 'react';
import { useState } from 'react';
import { useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import userphoto from "../../../assets/siteicon.png";
import { useEffect } from 'react';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';
import OrderDetail from '../shop/order/OrderDetail';

export default function Thankyou(props) {
  const[apiRun,setApiRun]=useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const getData = async() => {
      try {
        setApiRun(true);
        const response = await axios.post(route("store.product.order.details")
        ,{
          cart_id : orderDetails?.cart_id || "",
          creator_id : orderDetails?.creator?.id || "",
        }
      );
        if (response?.data?.status === true) {
            // window.location.href = response?.data?.url;
        } else {
            errorAlert(response?.data?.message);
        }
    } catch (error) {
        errorAlert(error?.response?.data?.message);
    }
    }

    useEffect(()=>{
      const getOrder=localStorage && localStorage.getItem('orderDetails') || null
      setOrderDetails(JSON.parse(getOrder));
      if(orderDetails && !apiRun){
      getData();
      }
    },[props])

    return (
        // <Authenticated auth={auth.user} user={user} >
        <>
            <Head title={"Thankyou"} />
            <style>{`
            .thankyou-wrap { min-height:89vh; }
            .giftthank {
              border:2px dashed var(--mint);
            }
            `}</style>

             <div className='p-4 text-center text-mint thankyou-wrap flex justify-content-center items-center'>
              <div>
                <h2 className='text-[25px] ' >Your gift has been sent.</h2>
                <p className='pt-2 pb-4' >Check your email for a receipt.</p>
                <div className='giftthank p-4' >
                  <p>Thank you from Spenny Piggy on behalf of {" "}
                    <span className='capitalize'>{orderDetails && orderDetails?.creator && orderDetails?.creator?.name} </span>
                    here.</p>

                    <div className="avatar rounded-[50%] w-20 h-20 overflow-hidden m-auto d-table mt-4 " >
                          <LazyLoadImage
                          src={orderDetails && orderDetails?.creator && orderDetails?.creator?.avatar_url || userphoto}
                          alt="image-avatar" className="img-fluid rounded w-full h-full object-cover" useIntersectionObserver={true} effect="blur"
                          height={100}
                          width={100} />
                    </div>

                  <div className='w-full mt-2' >
                    <Link href={`/${orderDetails && orderDetails?.creator && orderDetails?.creator?.username}`} className='underline' >
                        Visit @{orderDetails && orderDetails?.creator && orderDetails?.creator?.username}'s wishlist
                    </Link>
                  </div>
                </div>
                <div className='w-full mt-4' >
                  {orderDetails && orderDetails?.creator ?
                      <Link className='button lg mt-4' href={`/${orderDetails && orderDetails?.creator && orderDetails?.creator?.username}`}>
                        Back to profile
                      </Link>
                    :
                    <Link className='button lg mt-4' href={route("register")}>
                      Create a Gifter account
                    </Link>
                  }
                </div>
              </div>
             </div>
             </>
        // </Authenticated>
    )
}

