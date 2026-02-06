import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import PriceFormat from '@/includes/PriceFormat';
import LoadingScreen from '@/includes/LoadingScreen';
import Avatar from '@/includes/Avatar';

export default function GifterMembership(props) {

  const { auth, user, username, global_currency, itemid, min_surprise_amount  } = usePage().props;
  const { formatMultiPrice } = PriceFormat();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetch_items = async (p, load) => {
    setLoading(true);
    axios.get(`/gifter-memberships/${username}?page=${p}`)
    .then((resp) => {
        setLoading(false);
        const newd = resp.data.membership
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

    const amount =(w && +w.amount) + ( w && +w.tax)
    return <div className='wish-grant my-3 pb-3 box rounded-xl  p-3' key={key} >
        <div className='flex justify-between items-center' >
          <Avatar 
          role={w && w.owner && w.owner.role}
          profile_status_lock={w && w.owner && w.owner.profile_status_lock == 2 ? true : false}
          name={w && w.owner && w.owner.name}
            subhead={`@${w && w.owner && w.owner.username}`}
            username={`${w && w.owner && w.owner.username}`}
            src={w && w.membership && w.membership.perma_link}
          /> 
          <div className='text-center'>
            <p className='text-uppercase mb-1 text-small' >{w && w?.membership && w?.membership.level}</p>
            <div className="badge bg-green-600 text-uppercase" > 
            {w && w?.membership && w?.membership.level == 'lifetime' ? "Life Time" : 'Monthly'}
            </div>
          </div>
        </div>
          <div className="border-top pt-3 mt-3 flex justify-between items-center" >
              <p className="mb-0 pe-2" >Price</p>
              <p className="text-muted text-small">{formatMultiPrice(amount, w && w.currency)}</p>
          </div> 
    </div>
  }

  return (
    <div className={data && data.length < 1 && !loading ? 'd-none' : ''  } >
      <div className='box rounded-xl  p-4 mt-4 mb-4' >
        <h3 className='text-large text-dark title mb-2' >Active Memberships </h3>
          {data && data.map((d, i)=>{ 
            return <div key={`wishes-items-${i}`} ><Item  w={d} /></div>
          })}
          {loading ? <LoadingScreen hideimage={true} /> : ''}
          {!loading && hasMore ? <button onClick={()=>fetch_items(page+1, true)} className='loadmore-text' >Show More</button> : ''}
      </div> 
    </div>
  )
}
