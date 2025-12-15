import Avatar from '@/includes/Avatar'
import userphoto from "../../../assets/siteicon.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
export default function TopSupporters() {

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
            onClick={() => { try { const payload = { creator_id: supporter.id, creator_username: supporter.username }; if (payload.creator_id || payload.creator_username) { axios.post('/analytics/search-click', payload); } } catch(_e) {} }}
          />
          <div className="index-badge">{index + 1}</div>
        </div>
      </div>
      <div className="rank-stats ps-2">
        <div className="text-right">
          <p className="toppercentage income font-semibold">
            {supporter.gift_count} {supporter.gift_count === 1 ? 'gift' : 'gifts'}
          </p>
          {/* <p className="text-xs text-gray-500" title={`Support types: ${supporter.support_types?.join(', ')}`}>
            {supporter.support_types?.length} {supporter.support_types?.length === 1 ? 'type' : 'types'}
          </p> */}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-[25px] p-4 mb-6 d-flex justify-content-center align-items-center" style={{minHeight: '200px'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-[25px] p-4 mb-6 text-center">
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="btn btn-sm btn-outline-danger ms-2" 
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
    {data.length > 0 ? <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
      <h2 className="font-GillSans text-start text-2xl uppercase text-dark" title="Ranked by number of support transactions">
        🏆 Top Supporters
      </h2>
      <p className='text-gray-500 mb-3'>Most active supporters by gift count</p>
    
      {data.length ? (
        data.map((supporter, index) => (
          <SupporterItem key={`${supporter.username}-${index}`} supporter={supporter} index={index} />
        ))
      ) : (
        <div className="my-4">
          <Nocontent classes="bg-white" text="No supporters yet" />
        </div>
      )}
    </div> : ''}
    </>
  );
}
