import React from 'react'
import axios from "axios";
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function IpRedirection() {
  const {ziggy, auth}  = usePage().props;
   useEffect(()=>{
        const fetchLocationData = async () => {
            try {
                await axios.get(`https://ipapi.co/json/`).then((resp)=>{
                    if(ziggy && ziggy.url === 'https://spennypiggy.co'){
                        if(resp.data && resp.data.country_code == 'GB'){
                            window.location = ('/redirecting');
                        }
                    }
                    if(ziggy && ziggy.url === 'https://uk.spennypiggy.co'){
                        if(resp.data && resp.data.country_code !== 'GB'){
                            window.location = ('/redirecting');
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
      
    </>
  )
}
