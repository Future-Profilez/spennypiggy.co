import Avatar from '@/includes/Avatar'
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import Nocontent from '@/includes/Nocontent';
import { trackSearchClick } from "@/includes/Analytics";

export default function RecentSupporters() {

  const [ period, setPeriod] = useState('last24hour');
  const [ loading, setLoading] = useState(false);
  const [ error, setError] = useState(null);
  const [ data, setData] = useState([]);

  const fetchSupport = (period) => {
    setLoading(true);
    setError(null);
    axios.get(`recent-gifters/${period}`)
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching supporters:", error);
        setError("Failed to load recent supporters. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!loading) {
      fetchSupport(period);
    }
  }, [period]);

  const SupportItem = ({ supporter, index }) => (
    <div className="rank py-3 border-bottom flex items-center justify-between">
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
      <div className="rank-stats ps-2">
        <p className="text-sm text-gray-500">
          Just now
        </p>
      </div>
    </div>
  );

  return (
    <>
    {loading ? (
      <div className="bg-gray-100 rounded-[25px] p-4 mb-6 flex justify-center items-center" style={{minHeight: '200px'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    ) : error ? (
      <div className="bg-gray-100 rounded-[25px] p-4 mb-6 text-center">
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2" 
            onClick={() => fetchSupport(period)}
          >
            Retry
          </button>
        </div>
      </div>
    ) : data.length > 0 ? <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
      <h2 className="text-bls font-GillSans text-start text-2xl uppercase text-dark ">Recent Supporters</h2>
      <p className='text-gray-500  mb-3'>Latest supporters who have shown their love.</p>
      
      {/* <div className="time-hrs">
        <button className={period === 'last24hour' ? "active" : ''} onClick={() => setPeriod('last24hour')}>Last 24 hrs </button>
        <button className={period === 'lasthour' ? "active" : ''} onClick={() => setPeriod('lasthour')}> Last Hour </button>
      </div> */}
      {/* {loading ? (
        <LoadingScreen />
      ) : (
        <>
        </>
      )} */}
      {data.length ? (
        data.map((supporter, index) => (
          <SupportItem key={supporter.id || `${supporter.username}_${index}`} supporter={supporter} index={index} />
        ))
      ) : (
        <div className="my-4">
          <Nocontent classes="bg-white" text="No recent supporters" />
        </div>
      )}
    </div> : ''}
    </>
  );
}
