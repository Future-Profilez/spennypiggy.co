import Avatar from '@/includes/Avatar'
import userphoto from "../../../assets/siteicon.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
export default function LeaderboardStars() {

  const { formatMultiPrice } = PriceFormat();
  const [ period, setPeriod] = useState('last24hour');
  const [ loading, setLoading] = useState(false);
  const [ error, setError] = useState(null);
  const [ data, setData] = useState([]);
  const [ lists, setLists] = useState([]);

  const fetchGifts = (period) => {
    setLoading(true);
    setError(null);
    axios.get(`leaderboard/star/lists`)
      .then((response) => {
         const l = response.data.data;
        setData(response.data.data);
        if(l.length > 0){
           setLists(l.slice(0, 10));
        }
      })
      .catch((error) => {
        console.error("Error fetching gifts:", error);
        setError("Failed to load top supporters. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!loading) {
      fetchGifts(period);
    }
  }, [period]);

  const GiftItem = ({ gift, index }) => (
    <div className="fading rank py-3 border-bottom flex items-center justify-between">
      <div className="flex items-center justify-between">
        <div className="wisher wisher-rank">
          <Avatar
            role={gift.role}
            profile_status_lock={gift.profile_status_lock == 2 ? true : false}
            name={gift.name}
            link={gift.username || null}
            subhead={`@${gift.username || "anonymous"}`}
            username={gift.username || ""}
            src={gift.avatar_url}
            onClick={() => { try { const payload = { creator_id: gift.id, creator_username: gift.username }; if (payload.creator_id || payload.creator_username) { axios.post('/analytics/search-click', payload); } } catch(_e) {} }}
          />
          <div className="index-badge">{index + 1}</div>
        </div>
      </div>
      <div className="rank-stats ps-2">
        <p className="toppercentage income">
          {formatMultiPrice(gift.amount, gift.currency || 'gbp')}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-[25px] p-4 d-flex justify-content-center align-items-center" style={{minHeight: '200px'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-[25px] p-4 text-center">
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2" 
            onClick={() => fetchGifts(period)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
   <>
    {lists.length > 0 ?  <div className="bg-gray-100 rounded-[25px] p-4">
      <h2 className=" font-GillSans  text-2xl uppercase text-dark text-start">🏅 Top Supporters</h2>
      <p className='text-gray-500  mb-3'>Fans who have shown the highest support through generous contributions.</p>
        <>
          {lists.length ? (
            lists.map((gift, index) => (
              <GiftItem key={`supportor${index}`} gift={gift} index={index} />
            ))
          ) : (
            ''
          )}
          {data.length == lists.length  ? '' : <div className='flex justify-center mt-3'>
            <button onClick={() => setLists(data)} className="text-black m-auto">See All</button>
          </div>}
        </>
    </div> : ''}
   </>
  );
}
