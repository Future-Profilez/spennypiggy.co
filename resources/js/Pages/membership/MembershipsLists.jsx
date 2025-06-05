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
      <div className='row' >
        {memberships && memberships.length && memberships.map((m, i)=>{
          return <div key={`membership-${i}`} className='col-lg-4 col-sm-6 mb-4' >
            <Membership IsloggedIn={IsloggedIn} item={m} />
          </div>
        }) || ''}
      </div>
      {memberships && memberships.length < 1 ? <Nocontent text="Nothing to see" /> : ''}
    </div>
  )
}
