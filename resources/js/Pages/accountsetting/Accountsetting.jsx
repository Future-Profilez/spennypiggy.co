import React, { useState } from 'react';
import closeblacksm from '../../../assets/img/closeblacksm.png';
import { Link } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';

export default function Accountsetting(props) {
    console.log("props aa",props)
    return (
        <Authenticated auth={props.auth} >
            <div className='blackbg py-2 pb-md-5'>
                <div className='accountsetting mx-auto border-mint whbg shadow-mint rounded-3xl mb-4 mb-md-5'>
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
            </div>
        </Authenticated>
    )
}
