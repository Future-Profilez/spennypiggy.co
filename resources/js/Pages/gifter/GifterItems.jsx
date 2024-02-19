import React from 'react'
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import PriceFormat from '@/includes/PriceFormat';
import LoadingScreen from '@/includes/LoadingScreen';
import { piggy } from '@/includes/Icons';
import Popup from '@/Components/Popup';

export default function GifterItems(props) {

  const { IsloggedIn } = props;
  const { auth, user, username, itemid, min_surprise_amount  } = usePage().props;
  const { formatMultiPrice } = PriceFormat();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetch_items = async (p, load) => {
    setLoading(true);
    axios.get(`/gifter-wish-items/${username}?page=${p}`)
    .then((resp) => {
        setLoading(false);
        const newd = resp.data.wishes
        console.log("newd", newd);
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

  useEffect(()=>{
    fetch_items(page);
  },[]);


  const MessageMedia = ({w}) => {
    console.log("media_url", w)
    return <>
      <Popup
        modalclassName="pinkmodal shadow-pink" space="0" size="md" action={close} classes={`mt-3 text-pink`}
        text={<>
          View Exclusive Reward 
        </>} > 
          <div className='video-payer-pop' >
            <img src={w && w?.media_url || ''} />
          </div>
      </Popup>
    </>
  }


  const Item = ({key, w}) => { 
    
    const Template = () => { 
      const total_amount = (+w.amount)+(+w.tax)
      const uname = user && user.username;
      const amount = formatMultiPrice(total_amount, w && w.currency);
      const owner  = w && w.owner && w.owner.name;
      const wishname  = w && w.wish && w.wish.wishname;
      const s = w && w.wish && w.wish.subscription;
      return <div className='box rounded-lg px-3 py-3  '>
       <div className='d-flex align-items-start '>

        <div className={`gift-icon mt-2 me-2 ${s == '0' ? 'mint' : s == '1' ? 'pink' : s == '2' ? 'voilet' : 'grey' }`} 
        dangerouslySetInnerHTML={{ __html: piggy }} />
        
        {s == '0' ? 
          <p className=' ' ><span className='text-capitalize' >{uname}</span> granted a wish of {amount} to <b>{owner}</b> on their wish <b>{wishname}</b>. 
          {/* <span className='text-small text-time text-capitalize' >14hrs ago</span> */}
          </p>
          : ''
        } 

        {s == '2' ? 
          <p className=' ' >
            <span className='text-capitalize' >{uname}</span> has graciously contributed an amount of {amount} towards one of <b>{owner}</b>'s wish {<b>{wishname}</b>}.
            {/* <span className='text-small text-time text-capitalize' >14hrs ago</span>  */}
          </p>
          : ''
        }

        {w && w.is_surprise   ? 
          <p className='' ><span className='text-capitalize' >{uname}</span> send a surprise gift of {amount} to <b>{owner}</b>. 
          {/* <span className='text-small text-time text-capitalize' >14hrs ago</span> */}
          </p>
          : ''
        }
      </div>
        {IsloggedIn && w && w.media_url ? <MessageMedia w={w} /> : ''}
      </div>
    }
    return <div className='wish-grant my-2' key={key} >
        <Template  />
    </div>
  }

  return (
    <div className={data && data.length < 1 && !loading ? 'd-none' : ''  } >
      <div className='box rounded-lg p-4 ' >
        <h3 className='text-large text-dark title mb-3' >Wish Granted </h3>
          {data && data.map((d, i)=>{ 
            return <div key={`wishes-items-${i}`} ><Item  w={d} /></div>
          })}
       {!loading && hasMore ? <button onClick={()=>fetch_items(page+1, true)} className='loadmore-text' >Show More</button> : ''}
       {loading ? <LoadingScreen hideimage={true} /> : ''}
      </div>
    </div>
  )
}
