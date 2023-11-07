import React from 'react';
import miniplantimg from '../../assets/img/miniplantimg.jpg';
import { Link } from '@inertiajs/react';
import ToCart from './ToCart';
import ShareProfile from './ShareProfile';
import AddCart from './AddCart';
import { useState } from 'react';

export default function Wishlistbox({ itm }) {

  console.log('item', itm);
  const [open, setOpen] = useState();

  const openAddtocart = () => { 
    setOpen(true);
    setTimeout(()=>{
      setOpen();
    },1000)
  }

  return <>
    <div className='wishlistcntbox whbg relative	 rounded-3xl shadow-voilet '>
    <AddCart item={itm} uuid={itm.uuid} action={open} />
      <div onClick={openAddtocart} className='wishlistimg cursor-pointer'>
        <img src={itm.perma_link} alt='img' className='rounded-t-3xl' />
      </div>
      <div onClick={openAddtocart} className='wishlistdetial cursor-pointer relative'>
        <div>
          <h4 className='fon-bold text-dark' >{itm.wishname}</h4>
          <h5 className='font-CeraGRBold text-dark'>£{itm.price}</h5>
        </div>
      </div>
      <div className='sharelinks'>
        <ShareProfile>
          <Link to="/" className='font-GillSans'>Share Link</Link>
        </ShareProfile>
      </div>
    </div>
  </>
}
