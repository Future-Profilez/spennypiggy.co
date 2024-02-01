import React from 'react'
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import PriceFormat from '@/includes/PriceFormat';
import LoadingScreen from '@/includes/LoadingScreen';

export default function GifterSubscriptions(props) {

  const { auth, user, username, global_currency, itemid, min_surprise_amount  } = usePage().props;
  const { formatMultiPrice } = PriceFormat();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetch_items = async (p, load) => {
    setLoading(true);
    axios.get(`/gifter-subs/${username}?page=${p}`)
    .then((resp) => {
        console.log("resp", resp);
        // setLoading(false);
        // const newd = resp.data.tips
        // if(load){
        //   const result = data.concat(newd);
        //   setData(result);
        // } else { 
        //   setData(newd);
        // }
        // setPage(p);
        // if(resp.data.last_page == resp.data.current_page){
        //   setHasMore(false);
        // }
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };

  useEffect(()=>{
    fetch_items(page);
  },[]);

  const Item = ({key, w}) => { 
    const Template = () => { 
      const total_amount = (+w.amount)+(+w.tax)
      const uname = user && user.username;
      const amount = formatMultiPrice(total_amount, w && w.currency);
      const owner  = w && w.owner && w.owner.name;
      const goalname  = w && w.tipGoal && w.tipGoal.name;

      return <div className='pb-3'>
          <p className=' ' ><span className='text-capitalize' >{uname}</span> just tip amount of {amount} on <b>{owner}'s</b> <b>'{goalname}'</b> goal. 
          {/* <span className='text-small text-time text-capitalize' >14hrs ago</span> */}
          </p>
      </div>
    }
    return <div className='wish-grant  my-2' key={key} >
        <Template  />
    </div>
  }

  return (
    <div className='box rounded-lg p-4 mt-4 ' >
      <h3 className='text-large text-dark title mb-2' >Tips </h3>
        {data && data.map((d, i)=>{ 
          return <div key={`wishes-items-${i}`} ><Item  w={d} /></div>
        })}
        {loading ? <LoadingScreen hideimage={true} /> : ''}
        {!loading && hasMore ? <button onClick={()=>fetch_items(page+1, true)} className='loadmore-text' >Show More</button> : ''}
    </div> 
  )
}
