import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import PriceFormat from '@/includes/PriceFormat';
import LoadingScreen from '@/includes/LoadingScreen';
import Avatar from '@/includes/Avatar';
import Popup from '@/Components/Popup';
import { LazyLoadImage } from 'react-lazy-load-image-component';

export default function ThankyouMessages(props) {

  const { auth, user, username, global_currency, itemid, min_surprise_amount  } = usePage().props;
  const { formatMultiPrice } = PriceFormat();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [close, setclose] = useState();

  const fetch_items = async (p, load) => {
    setLoading(true);
    axios.get(`/gifter-thanks-message/${username}?page=${p}`)
    .then((resp) => {
        setLoading(false);
        const newd = resp.data.messages
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


  
  
  const Item = ({key, w}) => { 
    
    const MessageMedia = () => {
      return <>
        <Popup
          modalclassName="pinkmodal shadow-pink" space="0" size="md" action={close} classes={`button sm`}
          text={<>
            View 
          </>} > 

          {w && w?.media_type == 'image'  ? 
            <div className='video-payer-pop' >
              <img playsInline='false' autoPlay src={w && w?.media_url || ''} controls controlsList='nodownload' />
            </div>
          :
            <div className='video-payer-pop' >
              <video playsInline='false' autoPlay src={w && w?.media_url || ''} controls controlsList='nodownload' />
            </div>
          }

        </Popup>
      </>
    }
    const type = w && w.media_type;
    return <div className='wish-grant box rounded-xl  p-3 my-2' key={key} >
      <p className='mb-3 text-grey ' ><span className='text-capitalize' >{w && w.owner && w.owner.name}</span> send a thankyou message {w && w.message ? <b>{w && w.message}</b> : ''} {type =='image' ? 'with attached pic' : type =='video' ? 'with attached video' : '' }.</p>
      <div className='flex justify-between items-center' >
        <Avatar name={w && w.owner && w.owner.name}
          subhead={`@${w && w.owner && w.owner.username}`}
          username={`${w && w.owner && w.owner.username}`}
          src={w && w.owner && w.owner.avatar}
        /> 
        {w && w?.media_url ? <MessageMedia /> : ''}
      </div>
    </div>
  }

  return (
    <div className={data && data.length < 1 && !loading ? 'd-none' : ''  } >
      <div className='box rounded-xl  p-4 mt-4 ' >
        <h3 className='text-large text-dark title mb-3' >Thankyou Messages </h3>
          {data && data.map((d, i)=>{ 
            return <div key={`wishes-items-${i}`} ><Item  w={d} /></div>
          })}
          {loading ? <LoadingScreen hideimage={true} /> : ''}
          {!loading && hasMore ? <button onClick={()=>fetch_items(page+1, true)} className='loadmore-text' >Show More</button> : ''}
      </div> 
    </div>
  )
}
