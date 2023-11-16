import React from 'react'
import profileimg from '../../assets/img/profileimg.png'
import editicon from '../../assets/img/editicon.png'
import giftimg from '../../assets/img/giftimg.jpg'
import cartbannerimg from '../../assets/img/cartbannerimg.jpg'
import Popup from '@/Components/Popup'
import ToCart from './ToCart'

export default function AddCart({action, uuid, item}) {

  return (
    <Popup action={action}  classes="d-none" >
      <div className='addCartModal relative whbg border-pink '>
        
        <div className='addCartModalHead rounded-3xl relative shadow-pink'>
            <h2 className='font-GillSans text-bl uppercase pt-8 text-lg relative z-1'>Add to Cart</h2>
        </div>
        <div className='cartModimg absolute left-0 top-0'>
            <img src={giftimg} alt='img' />
        </div>
        <div className='bannerrr p-4'>
        <div className='cartbanner'>
            <img src={item.perma_link ? item.perma_link : cartbannerimg} alt='img' />
        </div>
        <div className='cartTitle'>{item.wishname}</div>
        <div className='cartPrice font-CeraGRBold text-voilet mt-1 mb-3'>£ {item.price}</div>
          <div className='px-2 pb-2'>
              <ToCart text={item?.is_cart ? "Remove from cart" : `Add to cart`} classes='btn-pink lg w-100 mb-3 font-CeraGR' uuid={uuid} />
              <ToCart type='checkout' text="Add to cart and Checkout" classes='btn-pink lg w-100 font-CeraGR' uuid={uuid} />
          </div>
        </div>
      </div>
    </Popup>
  )
}
