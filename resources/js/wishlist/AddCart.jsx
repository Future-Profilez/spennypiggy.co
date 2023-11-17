import React from 'react'
import giftimg from '../../assets/img/giftimg.jpg'
import Popup from '@/Components/Popup'
import ToCart from './ToCart'
import uploadedimg from '../../assets/img/uploadedimg.png';
import { Link } from '@inertiajs/react'
import DirectCheckout from './DirectCheckout';

export default function AddCart(props) {

  const {auth, action, uuid, item} = props;

  return (
    <Popup size="md" action={action} modalclass="pinkmodal" classes="d-none" >
        
        <div className='addCartModalHead rounded-3xl relative shadow-pink'>
            <h2 className='font-GillSans text-bl uppercase pt-8 text-lg relative z-1 px-3 text-center'>Add to Cart</h2>
        </div>
        <div className='cartModimg absolute left-0 top-0'>
            <img src={giftimg} alt='img' />
        </div>
        <div className='bannerrr p-4'>
        <div className='cartbanner'>
            <img src={item.perma_link ? item.perma_link : uploadedimg} alt='img' />
        </div>
        <div className='cartTitle text-center'>{item.wishname}</div>
        <div className='cartPrice font-CeraGRBold text-voilet mt-1 mb-3 text-center'>£ {item.price}</div>
          <div className='px-2 pb-2'>
              {auth ?
              <>
              <ToCart  is_cart={item?.is_cart} text={`Add to cart`} 
              classes='btn-pink lg w-100 mb-3 font-CeraGR' uuid={uuid} />
              <Link href={route("cart")} className='text-pink font-CeraGR text-center m-auto d-table'  > View Cart</Link>
              </> 
              : 
               <DirectCheckout item={item} />
              }
          </div>
        </div>
    </Popup>
  )
}
