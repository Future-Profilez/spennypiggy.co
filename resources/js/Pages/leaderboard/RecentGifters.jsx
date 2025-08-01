import Avatar from '@/includes/Avatar'
import React from 'react'
import userphoto from "../../../assets/siteicon.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
export default function RecentGifters() {

  const { formatMultiPrice } = PriceFormat();
  const [ period, setPeriod] = useState('last24hour');
  const [ loading, setLoading] = useState(false);
  const [ data, setData] = useState([]);

  const fetchGifts = (period) => {
    setLoading(true);
    axios.get(`recent-gifters/${period}`)
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching gifts:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!loading) {
      fetchGifts(period);
    }
  }, [period]);

  const GiftItem = ({ gift, index }) => (
    <div className="rank py-3 border-bottom flex items-center justify-between">
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

  return (
    <>
    {data.length > 0 ? <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
      <h2 className="text-bls font-GillSans text-start text-2xl uppercase text-dark ">Who just showed love?</h2>
      <p className='text-gray-500  mb-3'>Latest fans who has just show support.</p>
      
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
        data.map((gift, index) => (
          <GiftItem key={gift.id} gift={gift} index={index} />
        ))
      ) : (
        <div className="my-4">
          <Nocontent classes="bg-white" text="Nothing to see" />
        </div>
      )}
    </div> : ''}
    </>
  );
}
