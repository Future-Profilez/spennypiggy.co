import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import PriceFormat from '@/includes/PriceFormat';
import LoadingScreen from '@/includes/LoadingScreen';
import Popup from '@/Components/Popup';

export default function GifterSubscriptions({IsloggedIn}) {

  const { auth, user, username, global_currency, itemid, min_surprise_amount  } = usePage().props;
  const { formatMultiPrice } = PriceFormat();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetch_items = async (p, load, signal) => {
    setLoading(true);
    axios.get(`/gifter-subscriptions/${username}?page=${p}`, {signal})
    .then((resp) => {
        setLoading(false);
        const newd = resp.data.subscriptions
        if(load){
          const result = data.concat(newd);
          setData(result);
        } else { 
          setData(newd);
        }
        setPage(p);
        if(resp.data.last_page == resp.data.current_page){
          setHasMore(false);
        }
    }).catch((_err) => {
        console.error("error", _err);
        setLoading(false);
    });
  };


  const MessageMedia = ({w}) => {
    return <>
      <Popup
        modalclass="pinkmodal shadow-[4px_4px_0px_0px_#FF007F]ink" space="0" size="md" action={false} classes={`mt-2 text-pink ps-1`}
        text={<> Adventure awaits 🌟🔍 tap here !! </>} > 
          <div className='video-payer-pop' >
            <img src={w && w?.media_url || ''} />
          </div>
      </Popup>
    </>
  }


  useEffect(()=>{
    const controller = new AbortController();
    const { signal } = controller;
    fetch_items(page, false, signal);
    return () => controller.abort();
  },[]);

  const Item = ({w}) => { 
    const Template = () => { 
      const total_amount = (+w.amount)+(+w.tax)
      const uname = user && user.username;
      const amount = formatMultiPrice(total_amount, w && w.currency);
      const item  = w && w.wish_item && w.wish_item.name;
      const owner  = w && w.owner && w.owner.name;
      const goalname  = w && w.tipGoal && w.tipGoal.name;
      return <div className='pb-3'>
          <p className='' ><span className='text-capitalize' >{uname}</span> just subscribed to <b>{owner}'s</b> subscription <b>{item}</b> of amount {amount}. 
          {IsloggedIn && w && w.media_url ? <MessageMedia w={w} /> : ''}
          </p>
      </div>
    }
    return <div className='wish-grant my-2' >
        <Template  />
    </div>
  }

  return (
    <div className='box rounded-[30px]   p-4 mt-4 ' >
      <h3 className='text-large text-dark title mb-2' >Subscriptions </h3>
        {data && data.map((d, i)=>{ 
          return <div key={`wishes-items-${i}`} ><Item  w={d} /></div>
        })}
        {loading ? <LoadingScreen hideimage={true} /> : ''}
        {!loading && hasMore ? <button onClick={()=>fetch_items(page+1, true)} className='loadmore-text' >Show More</button> : ''}
    </div> 
  )
}
