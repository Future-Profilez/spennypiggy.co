import React from 'react'
import Membership from './Membership';
import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';
import Nocontent from '@/includes/Nocontent';
import LoadingScreen from '@/includes/LoadingScreen';
import { usePage } from '@inertiajs/react';

export default function MembershipsLists(props) {

  const {username, IsloggedIn, isUpdated} = props;
  const { memberships } = usePage().props;


  return (
    <div className='min-height'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 !gap-2 sm:!gap-3 md:!gap-4' >
        {memberships && memberships.length && memberships.map((m, i)=>{
          return <div key={`membership-${i}`} className=' ' >
            <Membership IsloggedIn={IsloggedIn} item={m} />
          </div>
        }) || ''}
      </div>
      {memberships && memberships.length < 1 ? <Nocontent text="Nothing to see" /> : ''}
    </div>
  )
}
