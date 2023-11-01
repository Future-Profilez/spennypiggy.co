import React from 'react';
import { Link, Head } from '@inertiajs/react';
import spennypiggy from '../../assets/img/spenny-piggy.png';

export default function Header({ user }) {
//   console.log('auth-header', user);
  return (
    <div className='mintbg py-14'>
      <div className='header flex w-full items-center content-center justify-between pinkbg'>
        <div className='headtitle text-wh font-GillSans'>Create Wishlist</div>
        <div className='spennylogo'><Link to={route('home')}><img src={spennypiggy} /></Link></div>
        <div className='cartLogin'>
          <a href='#' className='cartLink'>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M25.5002 27.0002C23.8352 27.0002 22.5002 28.3352 22.5002 30.0002C22.5002 30.7959 22.8163 31.559 23.3789 32.1216C23.9415 32.6842 24.7046 33.0002 25.5002 33.0002C26.2959 33.0002 27.059 32.6842 27.6216 32.1216C28.1842 31.559 28.5002 30.7959 28.5002 30.0002C28.5002 29.2046 28.1842 28.4415 27.6216 27.8789C27.059 27.3163 26.2959 27.0002 25.5002 27.0002ZM1.50024 3.00024L1.50024 6.00024H4.50024L9.90024 17.3852L7.86024 21.0602C7.63524 21.4802 7.50024 21.9752 7.50024 22.5002C7.50024 23.2959 7.81631 24.059 8.37892 24.6216C8.94153 25.1842 9.70459 25.5002 10.5002 25.5002H28.5002V22.5002H11.1302C11.0308 22.5002 10.9354 22.4607 10.8651 22.3904C10.7948 22.3201 10.7552 22.2247 10.7552 22.1252C10.7552 22.0502 10.7702 21.9902 10.8002 21.9452L12.1502 19.5002H23.3252C24.4502 19.5002 25.4402 18.8702 25.9502 17.9552L31.3202 8.25024C31.4252 8.01024 31.5002 7.75524 31.5002 7.50024C31.5002 7.10242 31.3422 6.72089 31.0609 6.43958C30.7796 6.15828 30.3981 6.00024 30.0002 6.00024L7.81524 6.00024L6.40524 3.00024M10.5002 27.0002C8.83524 27.0002 7.50024 28.3352 7.50024 30.0002C7.50024 30.7959 7.81631 31.559 8.37892 32.1216C8.94153 32.6842 9.70459 33.0002 10.5002 33.0002C11.2959 33.0002 12.059 32.6842 12.6216 32.1216C13.1842 31.559 13.5002 30.7959 13.5002 30.0002C13.5002 29.2046 13.1842 28.4415 12.6216 27.8789C12.059 27.3163 11.2959 27.0002 10.5002 27.0002Z" fill="#3CFCCF" />
            </svg>
          </a>
          {user && user.name ? <><Link method="post" href={route('logout')} as="button" className='btn-mint'>Logout</Link></> :
            <><Link to={route("login")} className='btn-mint'>Login</Link></>}



        </div>
      </div>
    </div>
  )
}
