import React from 'react'
import { useState } from 'react';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';

export default function TweetNow({id, type}) {
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const [loading, setloading] = useState(false);
  const tweetnow = () => { 
    setloading(true);
    axios.get(`twitter/share/${id}/${type}`).then(resp => {
      if(resp.data.status){
          successAlert(resp.data.msg);
      } else {
          errorAlert(resp.data.msg);
      }
       setloading(false);
    }).catch(_err => {
        console.error("error", _err);
        setloading(false);
    });
  }

  return (
    <>
    <style>{`
    .twiiter-share:hover { 
      color:#000 !important;
    } 
    `}</style>
    <button onClick={tweetnow} className='twiiter-share text-normal  text-primary mt-3'
      disabled={loading}  >
      {loading ? "Posting on twitter..." : "Announce on twitter"}</button></>
  )
}
