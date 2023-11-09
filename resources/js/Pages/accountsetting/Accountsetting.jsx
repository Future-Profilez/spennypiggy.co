import React, { useState } from 'react';
import Popup from '../../includes/Popup';
import closeblacksm from '../../assets/img/closeblacksm.png';
import { Link } from '@inertiajs/react';

export default function Accountsetting() {
  return (
    <div className='accountsetting mx-auto border-mint whbg shadow-mint rounded-3xl pb-20'>
        <div className='loginheadbox pinkbg'>
            <span className='mintbg'></span>
            <span className='bluebg'></span>
        </div>
        <div className='accsettingList p-4'>
            <ul>
                <li> 
                    <Link>PAYMENT DASHBOARD <span className='text-voilet'>stripe</span></Link>
                    
                </li>

                <li>
                    <button>Email <span className='text-gray'>warner99@gmail.com</span></button>
                </li>

                <li>
                    <button>PASSWORD </button>
                </li>

                <li>
                    <button>DISPLAY CURRENCY  <span className='text-gray'>warner99@gmail.com</span></button>
                </li>

                <li>
                    <button>DISPLAY CURRENCY  <span className='text-gray'>GBP</span></button>
                </li>

                <li>
                    <button>DELETE ACCOUNT  </button>
                </li>

                <li>
                    <Link>SET UP AUTO TWEET <img src={closeblacksm} alt="img" /></Link>
                </li>

                <li>
                    <div className='notification'>
                    RECEIVE NOTIFICATION ON EMAIL 
                        <label class="switch">
                            <input type="checkbox"></input>
                            <span class="sliderSw round"></span>
                        </label>
                    </div>
                </li>
                
            </ul>
        </div>
    </div>
  )
}
