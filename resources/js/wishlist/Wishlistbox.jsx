import React from 'react';
import miniplantimg from '../../assets/img/miniplantimg.jpg';
import { Link } from '@inertiajs/react';
import ToCart from './ToCart';

export default function Wishlistbox({ itm }) {
  console.log('item', itm);
  return (
    <div className='wishlistcntbox whbg relative	 rounded-3xl shadow-voilet '>
      <div className='wishlistimg'>
        <img src={itm.perma_link} alt='img' className='rounded-t-3xl' />
      </div>

      <div className='wishlistdetial  relative'>
        <button className='sharebtn'><svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none">
          <path d="M13.8216 4.30767C13.3478 4.52306 12.837 4.6646 12.3078 4.73229C12.8493 4.40614 13.2678 3.88921 13.4647 3.26767C12.9539 3.57537 12.3878 3.79075 11.7908 3.91383C11.3047 3.3846 10.6216 3.0769 9.84622 3.0769C8.40006 3.0769 7.21852 4.25844 7.21852 5.7169C7.21852 5.92613 7.24314 6.12921 7.28622 6.31998C5.09545 6.20921 3.14468 5.1569 1.84622 3.56306C1.61852 3.95075 1.48929 4.40614 1.48929 4.88613C1.48929 5.80306 1.95083 6.61537 2.66468 7.0769C2.22775 7.0769 1.8216 6.95383 1.46468 6.76921V6.78767C1.46468 8.06767 2.37545 9.13844 3.5816 9.37844C3.19436 9.48442 2.78781 9.49916 2.39391 9.42152C2.56105 9.94612 2.88839 10.4052 3.32992 10.7341C3.77144 11.063 4.30495 11.2453 4.85545 11.2554C3.9223 11.9941 2.7656 12.3934 1.57545 12.3877C1.36622 12.3877 1.15698 12.3754 0.947754 12.3507C2.11698 13.1015 3.50775 13.5384 4.99698 13.5384C9.84622 13.5384 12.5108 9.51383 12.5108 6.0246C12.5108 5.90767 12.5108 5.7969 12.5047 5.67998C13.0216 5.31075 13.4647 4.84306 13.8216 4.30767Z" fill="#5D25FD" />
        </svg> Share</button>

        <div>
          <h3>{itm.wishname}</h3>
          <h4 className='font-CeraGRBold'>£{itm.price}</h4>
        </div>
      </div>
      <div className='sharelinks'>
        <Link to="/" className='font-GillSans'>Share Link</Link>
      </div>

      <ToCart uuid={itm.uuid} />
    </div>
  )
}
