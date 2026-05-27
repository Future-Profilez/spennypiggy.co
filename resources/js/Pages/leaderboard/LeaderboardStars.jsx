import Avatar from '@/includes/Avatar'
import userphoto from "../../../assets/siteicon.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
import { trackSearchClick } from "@/includes/Analytics";

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
    <div className="fading rank py-3 border-b border-gray-200 flex items-center justify-between">
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
            onClick={() => trackSearchClick(gift.id, gift.username)}
          />
          <div className="index-badge">{index + 1}</div>
        </div>
      </div>
      <div className="rank-stats pl-2">
        <p className="toppercentage income">
          {formatMultiPrice(gift.amount, gift.currency || 'gbp')}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-[30px]   p-4 flex justify-center items-center" style={{minHeight: '200px'}}>
        <svg className="animate-spin h-8 w-8 text-[#FF007F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-[30px]   p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
          <button 
            className="px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors ml-2" 
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
    {lists.length > 0 ?  <div className="bg-gray-100 rounded-[30px]   p-4">
      <h2 className=" font-GillSans  text-2xl uppercase text-gray-900 text-left">🏅 Top Supporters</h2>
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
