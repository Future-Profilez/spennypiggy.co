import React from 'react';
import miniplantimg from '../../assets/img/miniplantimg.jpg';
import { Link } from '@inertiajs/react';
import ToCart from './ToCart';
import ShareProfile from './ShareProfile';

export default function Wishlistbox({ itm }) {
  console.log('item', itm);
  return (
    <div className='wishlistcntbox whbg relative	 rounded-3xl shadow-voilet '>
      <div className='wishlistimg'>
        <img src={itm.perma_link} alt='img' className='rounded-t-3xl' />
      </div>
      <div className='wishlistdetial  relative'>
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

      <ToCart uuid={itm.uuid} />
    </div>
  )
}
