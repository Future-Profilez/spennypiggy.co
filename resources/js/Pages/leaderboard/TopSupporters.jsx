import Avatar from '@/includes/Avatar'
import userphoto from "../../../assets/siteicon.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
import { trackSearchClick } from "@/includes/Analytics";

export default function TopSupporters({grid = false}) {

  const { formatMultiPrice } = PriceFormat();
  const [ period, setPeriod] = useState('frequency');
  const [ loading, setLoading] = useState(false);
  const [ error, setError] = useState(null);
  const [ data, setData] = useState([]);

  const fetchSupporters = (period) => {
    setLoading(true);
    setError(null);
    axios.get(`top-supporters/frequency`)
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching supporters:", error);
        setError("Failed to load top supporters. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!loading) {
      fetchSupporters(period);
    }
  }, [period]);

  const SupporterItem = ({ supporter, index }) => (
    <div className="fading rank py-3 border-b flex items-center justify-between">
      <div className="flex items-center justify-between">
        <div className="wisher wisher-rank">
          <Avatar
            role={supporter.role}
            profile_status_lock={supporter.profile_status_lock == 2 ? true : false}
            name={supporter.name}
            link={supporter.username || null}
            subhead={`@${supporter.username || "anonymous"}`}
            username={supporter.username || ""}
            src={supporter.avatar_url}
            onClick={() => trackSearchClick(supporter.id, supporter.username)}
          />
          <div className="index-badge">{index + 1}</div>
        </div>
      </div>
      <div className="rank-stats pl-2">
        <div className="text-right">
          <p className="toppercentage income font-semibold">
            {supporter.gift_count} {supporter.gift_count === 1 ? 'gift' : 'gifts'}
          </p>
          {/* 
          <p className="text-xs text-gray-500" title={`Support types: ${supporter.support_types?.join(', ')}`}>
            {supporter.support_types?.length} {supporter.support_types?.length === 1 ? 'type' : 'types'}
          </p>
           */}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-[30px]  p-4 mb-6 flex justify-center items-center" style={{minHeight: '200px'}}>
        <svg className="animate-spin h-8 w-8 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-[30px]  p-4 mb-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          {error}
          <button 
            className="px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors ml-2" 
            onClick={() => fetchSupporters(period)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    {data && data.length > 0 ? <div className="bg-gray-100 rounded-[30px]  p-4 mb-6">
      <h2 className="font-GillSans text-left text-2xl uppercase text-gray-900" title="Ranked by number of support transactions">
        🏆 Top Supporters
      </h2>
      <p className='text-gray-500 mb-3'>Most active supporters by gift count</p>
    
      {data && data.length ? (
        <>
        {grid ? 
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {data && data.map((supporter, index) => (
              <SupporterItem key={`${supporter.username}-${index}`} supporter={supporter} index={index} />
            ))}
          </div>
          :
          <>
            {data && data.map((supporter, index) => (
              <SupporterItem key={`${supporter.username}-${index}`} supporter={supporter} index={index} />
            ))}
          </>
        }
        </>
      ) : (
        <div className="my-4">
          <Nocontent classes="bg-white" text="No supporters yet" />
        </div>
      )}
    </div> : ''}
    </>
  );
}
