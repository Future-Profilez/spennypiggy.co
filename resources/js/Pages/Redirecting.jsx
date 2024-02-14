import React from 'react'
import axios from 'axios'
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useEffect } from 'react';

export default function Redirecting() {

  const {ziggy}  = usePage().props;
  const [url, setUrl] = useState('');

  useEffect(()=>{
    const fetchLocationData = async () => {
        try {
            await axios.get(`https://ipapi.co/json/`).then((resp)=>{
                if(ziggy && ziggy.url === 'https://spennypiggy.co'){
                    if(resp.data && resp.data.country_code == 'GB'){
                        setUrl('https://uk.spennypiggy.co');
                        setTimeout(()=>{
                          window.location = `https://uk.spennypiggy.co`;
                        },3000);
                    }
                }
                if(ziggy && ziggy.url === 'https://uk.spennypiggy.co'){
                    if(resp.data && resp.data.country_code !== 'GB'){
                        setUrl('https://spennypiggy.co');
                        setTimeout(()=>{
                          window.location = `https://spennypiggy.co`;
                        },3000);
                    }
                }
            }).catch((err)=>{
                console.error("api err", err)
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    fetchLocationData();
}, []);


  return (
    <>
    <style>{`
    .redirect-page{height:100vh;display:flex;align-items:center;justify-content:center;}
    .loader{width:30px;height:30px;position:relative;margin:auto;}
    .loader::before,.loader::after{content:"";position:absolute;}
    .loader-3::before,.loader-3::after{border-radius:50%;-webkit-animation-duration:1s;animation-duration:1s;-webkit-animation-timing-function:ease-in-out;animation-timing-function:ease-in-out;-webkit-animation-iteration-count:infinite;animation-iteration-count:infinite;}
    .loader-3::before{width:16px;height:16px;top:calc(50% - 8px);left:calc(50% - 8px);border-bottom-right-radius:0;box-shadow:0 0 0 2px #000;background:radial-gradient(transparent 0,black 3px,#fff 3px);transform:rotate(45deg);-webkit-animation-name:mapPin;animation-name:mapPin;}
    .loader-3::after{width:10px;height:5px;opacity:0.8;top:100%;left:calc(50% - 4px);background:#000;-webkit-animation-name:mapPinShadow;animation-name:mapPinShadow;}
    @-webkit-keyframes mapPin{
      50%{transform:rotate(45deg) translate(-50%,-50%);}
    }
    @keyframes mapPin{
      50%{transform:rotate(45deg) translate(-50%,-50%);}
    }
    @-webkit-keyframes mapPinShadow{
      50%{transform:scaleX(3);opacity:0.2;}
    }
    @keyframes mapPinShadow{
      50%{transform:scaleX(3);opacity:0.2;}
    }
    `}</style>

    <div className='redirect-page bg-white p-5'>
      <div>
        <div className="loader-item">
          <div className="loader loader-3"></div>
        </div>
        {url ? <h2 className='redirection-text mt-3 text-large' >Redirecting to {url} </h2> : ''}
      </div>
    </div>
    </>
  )
}
