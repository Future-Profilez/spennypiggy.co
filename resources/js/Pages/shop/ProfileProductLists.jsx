import React from 'react'
import ProfileProduct from './ProfileProduct'
import { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Nocontent from '@/includes/Nocontent';
import LoadingScreen from '@/includes/LoadingScreen';
export default function ProfileProductLists({profileuser}) {

   const { global_currency, auth, user } = usePage().props;
   const [lists, setLists] = useState([]);
   const [loading, setLoading] = useState(false);

   const fetchItems = () =>{
      setLoading(true);
      axios.get(`/shop/list/${profileuser && profileuser.username}`)
      .then(res =>{
         setLists(res.data.shops);
         setLoading(false);
      }).catch(err =>{
         setLoading(false);
      });
   }

   useEffect(()=>{
      fetchItems();
   }, []);

  return <>
      <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3' >
         {lists &&  lists.map((item, index) => <ProfileProduct key={index} item={item} />)}
      </div>
      {loading ? <LoadingScreen /> : "" }
      {!loading && lists.length < 1 ? <Nocontent text="Nothing to see" /> : ""}
  </>
}
