import React from 'react'
import Membership from './Membership';
import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';
import Nocontent from '@/includes/Nocontent';
import LoadingScreen from '@/includes/LoadingScreen';

export default function MembershipsLists(props) {

  const {username, IsloggedIn, isUpdated} = props;
  const [lists, setLists] = useState();
  const [loading, setLoading] = useState(false);
  const fetch_membership = (signal) => {
    setLoading(true);
    axios.get(`/memberships/${username}`, {signal}).then(resp => {
      setLists(resp.data.memberships || []);
      setLoading(false);
    }).catch(_err => {
        console.error("error", _err);
        setLoading(false);
    });
  }



  useEffect(()=>{ 
    const controller = new AbortController();
    const {signal} = controller;
    fetch_membership(signal)
    return () => controller.abort();
  },[isUpdated]);

  return (
    <div className='min-height'>

      {loading  ? <LoadingScreen /> : ""}
      
      <div className='row' >
        {lists && lists.length && lists.map((m, i)=>{
          return <div key={`membership-${i}`} className='col-lg-4 col-sm-6 mb-4' >
            <Membership fetch_membership={fetch_membership} IsloggedIn={IsloggedIn} item={m} />
          </div>
        }) || ''}
      </div>
      
      {lists && lists.length < 1 ? <Nocontent text="Nothing to see" /> : ''}

    </div>
  )
}
