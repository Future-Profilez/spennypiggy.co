  import axios   from 'axios';
  import React from 'react'
  import { useState } from 'react';
  import { useEffect } from 'react';
  import Post from '../feed/Post';
  import { usePage } from '@inertiajs/react';
  import LoadingScreen from '@/includes/LoadingScreen';
  import Nocontent from '@/includes/Nocontent';
  export default function MembershipLists({username}) {
  
    const { user, auth } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [subs, setsubs] = useState([]);
  
    const fetchMemberships = () => {
      setLoading(true);
      axios.get(`/gifter-memberships/${username}/?membershipslists`).then((resp) => {
        console.log("resp", resp)
        setsubs(resp.data.membership || []);
        setLoading(false);
      }).catch((_err) => {
        console.error("subscriptions error", _err);
        setLoading(false);
      });
    };
    
    useEffect(()=>{
      fetchMemberships();
    },[]);

    
    const fetchsubs = () => {
      setLoading(true);
      axios.get(`/gifter-subscriptions/${username}/?membershipslists`).then((resp) => {
        console.log("resp", resp)
        setsubs(resp.data.subscriptions || []);
        setLoading(false);
      }).catch((_err) => {
        console.error("subscriptions error", _err);
        setLoading(false);
      });
    };
    
    useEffect(()=>{
      fetchsubs();
    },[]);


    const MembershipItem = () => { 
      return <>
       
      </>
    }
  
    return (
      <div className='max-feed m-auto'>
        {loading ? <LoadingScreen /> :
        <>
          {subs && subs.length ? subs.map((item, i)=>{ 
            return <MembershipItem key={`memberships-${i}`} item={item} />
          }) : <Nocontent text="No subs to see" /> }
        </> }
      </div>
    )
  }
  