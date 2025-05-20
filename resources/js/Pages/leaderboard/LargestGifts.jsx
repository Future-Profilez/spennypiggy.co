import Avatar from '@/includes/Avatar'
import React from 'react'
import userphoto from "../../../assets/img/userphoto.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
export default function LargestGifts() {

  const { formatMultiPrice } = PriceFormat();
  const [period, setPeriod] = useState('last24hour');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const fetchGifts = (period) => {
    setLoading(true);
    axios.get(`largest-gifts/${period}`)
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
    <div className="rank py-3 border-bottom d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center justify-content-between">
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
    <div className="rank_lists largest bg-white p-4 rounded-lg mt-4">
      <h2 className="text-bl font-GillSans text-start text-2xl uppercase text-dark mb-4">Largest Gifts</h2>
      
      <div className="time-hrs">
        <button className={period === 'last24hour' ? "active" : ''} onClick={() => setPeriod('last24hour')}>Last 24 hrs </button>
        <button className={period === 'lasthour' ? "active" : ''} onClick={() => setPeriod('lasthour')}> Last Hour </button>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          {data.length ? (
            data.map((gift, index) => (
              <GiftItem key={gift.id} gift={gift} index={index} />
            ))
          ) : (
            <div className="my-4">
              <Nocontent classes="bg-white" text="Nothing to see" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
