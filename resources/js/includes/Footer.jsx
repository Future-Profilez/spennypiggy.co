import React from 'react'
import footlogo from '../../assets/img/footlogo.png'; 
import { Link } from '@inertiajs/react';
import Nocontent from './Nocontent';


export default function 
() {
  return (
    <div>
        <div className='footer'>
          <div className='containerbox'>
            <div className='footlogo'>
              <Link href="/" >
                <img src={footlogo} alt="img" />
              </Link>
            </div>
            <div className='footlinksbox'>
              <div className='footlinks'>
                <ul>
                  <li><Link href="/" >FAQ & Help</Link></li>
                  <li><Link href={route("how-it-works")} >How it works</Link></li>
                  <li><Link href={route("login")} >Login</Link></li>
                </ul>
              </div>
          </div>
        </div>
        <div className='copyright'>Copyright &copy; 2023 Spenny Piggy</div>
      </div>
    </div>
  )
}