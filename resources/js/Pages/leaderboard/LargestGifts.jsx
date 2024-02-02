import Avatar from '@/includes/Avatar'
import React from 'react'
import userphoto from "../../../assets/img/userphoto.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
export default function LargestGifts() {

  const { formatMultiPrice } = PriceFormat();


  const [period, setperiod] = useState('last24hour');
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState([]);
  const fetch = (e) => {
    setperiod(e);
    setLoading(true);
    axios.get(`largest-gifts/${e}`).then((resp) => {
        setLoading(false);
        setData(resp.data.data);
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };

  useEffect(()=>{
    if(!loading){
      fetch(period);
    }
  },[]);

  const Income = ({s, index}) => {
    return <div className="rank py-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center justify-content-between" >
            <div className="wisher wisher-rank" >
              <Avatar name={s && s.name}
              link={s && s.username || null}
              subhead={`@${s && s.username || "anonymous"}`}
              username={s && s.username || ""}
              src={s && s.avatar_url} />
              <div className='index-badge' >{index}</div>
            </div> 
          </div>
          <div className="rank-stats" >
            <p className="toppercentage income " >{formatMultiPrice(s && s.amount, s && s.currency || 'gbp')}</p>
          </div> 
    </div>
  }

  return (
    <div className="rank_lists largest  bg-white p-4 rounded-lg mt-4 " >
      <h2 className="text-bl font-GillSans  text-start text-2xl 
      uppercase text-dark mb-4">Largest Gifts</h2>
      <div className='time-hrs' >
        <button className={period == 'last24hour' ? "active" : ''} onClick={()=>fetch('last24hour')} >Last 24 hrs</button>
        <button className={period == 'lasthour' ? "active" : ''} onClick={()=>fetch('lasthour')} >Last Hour</button>
      </div>

      {loading ? <LoadingScreen /> :
      <>
        {data && data.length ? data.map((s, i) => { 
            return <Income s={s} index={i+1} />
        }) : <div className='my-4' ><Nocontent classes={'bg-white'} text='Nothing to see' /></div> }
      </>
      }
      
    </div>
  )
}
