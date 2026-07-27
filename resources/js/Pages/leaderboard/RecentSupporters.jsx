import Avatar from '@/includes/Avatar'
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import Nocontent from '@/includes/Nocontent';
import { trackSearchClick } from "@/includes/Analytics";
import { fetchBundle } from './useBundle';

const DEFAULT_PERIOD = 'last24hour';

export default function RecentSupporters() {

  const [ period, setPeriod] = useState(DEFAULT_PERIOD);
  const [ loading, setLoading] = useState(false);
  const [ error, setError] = useState(null);
  const [ data, setData] = useState([]);
  const formatRelativeTime = (dateLike) => {
    if (!dateLike) return "Just now";
    const date = new Date(dateLike);
    if (Number.isNaN(date.getTime())) return "Just now";

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const fetchSupport = (nextPeriod) => {
    setLoading(true);
    setError(null);

    // The default period is already in the shared bundle, so opening the page
    // costs no request here. Only a period the bundle doesn't cover is fetched.
    const request = nextPeriod === DEFAULT_PERIOD
      ? fetchBundle().then((bundle) => bundle?.recent_supporters ?? null)
      // route(), never a relative path: this page rewrites its own URL when the
      // board period changes, and `recent-gifters/…` resolved against
      // `/leaderboard/weekly` asks for `/leaderboard/recent-gifters/…` → 404.
      : axios.get(route('largest-gifts', nextPeriod)).then((response) => response.data);

    request
      .then((payload) => {
        if (!payload) throw new Error('recent supporters unavailable');
        setData(payload.data ?? []);
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
    fetchSupport(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          {formatRelativeTime(supporter.created_at)}
        </p>
      </div>
    </div>
  );

  return (
    <>
    {loading ? (
      <div className="bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6 flex justify-center items-center" style={{minHeight: '200px'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    ) : error ? (
      <div className="bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6 text-center">
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            className="button esm border-red-600 text-red-600 ml-2" 
            onClick={() => fetchSupport(period)}
          >
            Retry
          </button>
        </div>
      </div>
    ) : data.length > 0 ? <div className="bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6">
      <h2 className="text-bls text-19 font-semibold tracking-tight text-[#0B0B0C] ">Recent Supporters</h2>
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
