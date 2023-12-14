import Avatar from '@/includes/Avatar'
import React from 'react'
import userphoto from "../../../assets/img/userphoto.png";
import { useState } from 'react';
export default function LargestGifts() {

  const [period, setperiod] = useState(1);
  const fetch = (e) => { 
    setperiod(e);
  }

  const Income = () => {
    return <div className="rank py-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center justify-content-between" >
            <div className="wisher" >
              <Avatar name={`Anonymous`}
              link={"n.user && n.user.username || null"}
              subhead={"anonymous"}
              username={"anonymous"}
              src={userphoto} />
            </div> 
          </div>
          <div className="rank-stats" >
            <p className="toppercentage income " >0.01%</p>
          </div> 
    </div>
  }

  return (
    <div className="rank_lists largest  bg-white p-4 rounded-lg" >
      <h2 className="text-bl font-GillSans  text-start text-2xl 
      uppercase text-dark mb-4">Largest Gifts</h2>
      <div className='time-hrs' >
        <button className={period == 1 ? "active" : ''} onClick={()=>fetch(1)} >Last Hour</button>
        <button className={period == 24 ? "active" : ''} onClick={()=>fetch(24)} >Last 24 hrs</button>
      </div>
      <Income />  
      <Income />  
    </div>
  )
}
