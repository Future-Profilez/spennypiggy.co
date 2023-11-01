import React from 'react'
import footlogo from '../../assets/img/footlogo.png';
import { Link, Head } from '@inertiajs/react';

export default function Footer() {
  return (
    <div>
        <div className='footer bluebg'>
          <div className='containerbox'>
            <div className='footlogo'>
              <Link to={route('home')} >
                <img src={footlogo} alt="img" />
              </Link>
            </div>
            <div className='footlinksbox'>
              <div className='footlinks'>
                <h2>Help</h2>

                <ul>
                  <li><Link to={route('login')} >Login</Link></li>
                  <li><Link to="/" >Exchange</Link></li>
                  <li><Link to="/" >Storefront</Link></li>
                  <li><Link to="/" >For Brands</Link></li>
                  <li><Link to="/" >Blog</Link></li>
                </ul>
              </div>

              <div className='footlinks'>
                <h2>Legal</h2>

                <ul>
                  <li><Link to="/" >FAQ & Help</Link></li>
                  <li><Link to="/" >How it works</Link></li>
                  <li><Link to="/" >Contact</Link></li>
                </ul>
              </div>

              <div className='footlinks'>
                <h2>General</h2>
                <ul>
                <li><Link to="/" >Terms & Service</Link></li>
                <li><Link to="/" >Privacy Policy</Link></li>
                <li><Link to="/" >Data Security</Link></li>
                <li><Link to="/" >Careers</Link></li>
                <li><Link to="/" >About</Link></li>
                </ul>
              </div>
          </div>
        </div>
        <div className='copyright'>Copyright &copy; 2023 Whoyouinto</div>
      </div>
    </div>
  )
}
