import Avatar from '@/includes/Avatar'
import React from 'react'
import userphoto from "../../../assets/siteicon.png";
import { useState } from 'react';
import  axios  from 'axios';
import { useEffect } from 'react';
import LoadingScreen from '@/includes/LoadingScreen';
import PriceFormat from '@/includes/PriceFormat';
import Nocontent from '@/includes/Nocontent';
export default function LargestGifts() {

  const { formatMultiPrice } = PriceFormat();
  const [ period, setPeriod] = useState('last24hour');
  const [ loading, setLoading] = useState(false);
  const [ error, setError] = useState(null);
  const [ data, setData] = useState([]);

  const fetchGifts = (period) => {
    setLoading(true);
    setError(null);
    axios.get(`largest/gifts/alltime`)
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching gifts:", error);
        setError("Failed to load largest gifts. Please try again.");
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
    {data.length > 0 ? <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
      <h2 className="  font-GillSans text-start text-2xl uppercase text-dark ">Largest Gifts</h2>
      <p className='text-gray-500  mb-3'>Who dropped the fattest piggy</p>
    
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
