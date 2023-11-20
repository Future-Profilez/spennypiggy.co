import React from 'react'
import userphoto from '../../assets/img/userphoto.png';
import { Link } from '@inertiajs/react';
import wishlistbannerimg from '../../assets/img/wishlistbannerimg.jpg';
import SocialLinks from '@/includes/SocialLinks';

export default function Userprofile({user, links}) {
  return (
    <div className='userprofilesec rounded-3xl whbg'>
      
      <div className='userphotobox pinkbg pink-shadow flex justify-center relative'>
          <img className='d-lg-none' src={user && user?.cover_url || wishlistbannerimg} alt='img' />
      </div>

    <div className='userPr p-4' >
      <div className='userphoto'>
        <img src={user && user.avatar_url ? user.avatar_url : userphoto} alt='img' />
      </div>
      <h2 className='font-GillSans'>{user && user.name }</h2>
      <div className='userId flex items-center justify-center'>@{user && user.username} 
      <Link to="/" className='ms-2'>
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" viewBox="0 0 19 18" fill="none">
          <path d="M12.3284 13.2427L9.49998 16.0711C8.52182 17.0492 7.34307 17.5383 5.96374 17.5383C4.58441 17.5383 3.40614 17.0492 2.42892 16.0711C1.45075 15.0929 0.96167 13.9142 0.96167 12.5348C0.96167 11.1555 1.45075 9.97724 2.42892 9.00001L5.25734 6.17159L6.67156 7.5858L3.84313 10.4142C3.25387 11.0035 2.95925 11.7106 2.95925 12.5355C2.95925 13.3605 3.25387 14.0676 3.84313 14.6569C4.43239 15.2461 5.13949 15.5408 5.96445 15.5408C6.78941 15.5408 7.49651 15.2461 8.08577 14.6569L10.9142 11.8284L12.3284 13.2427ZM7.37866 12.5355L5.96445 11.1213L11.6213 5.46448L13.0355 6.87869L7.37866 12.5355ZM13.7426 11.8284L12.3284 10.4142L15.1568 7.5858C15.7461 6.99654 16.0407 6.28944 16.0407 5.46448C16.0407 4.63952 15.7461 3.93242 15.1568 3.34316C14.5676 2.7539 13.8605 2.45928 13.0355 2.45928C12.2106 2.45928 11.5035 2.7539 10.9142 3.34316L8.08577 6.17159L6.67156 4.75737L9.49998 1.92895C10.4781 0.950782 11.6569 0.4617 13.0362 0.4617C14.4156 0.4617 15.5938 0.950782 16.5711 1.92895C17.5492 2.90711 18.0383 4.08586 18.0383 5.46519C18.0383 6.84452 17.5492 8.02279 16.5711 9.00001L13.7426 11.8284Z" fill="#8981A2" />
        </svg>
      </Link>
      </div>

      <SocialLinks links={links} />

      <p className={`text-muted text-center mt-3 ${user && !user.bio ? 'd-none' : ''}`} >{user && user.bio || ""}</p>
    </div>
      
    </div>
  )
}
