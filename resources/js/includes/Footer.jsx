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
              <Link to="/" >
                <img src={footlogo} alt="img" />
              </Link>
            </div>
            <div className='footlinksbox'>
              <div className='footlinks'>
                <ul>
                  <li><Link to="/" >FAQ & Help</Link></li>
                  <li><Link to="/" >How it works</Link></li>
                  <li><Link to="/" >Contact</Link></li>
                </ul>
              </div>
          </div>
        </div>
        <div className='copyright'>Copyright &copy; 2023 Speeny Piggy</div>
      </div>
    </div>
  )
}