import React, { useEffect } from 'react';
import { useState } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link, router, usePage } from "@inertiajs/react";
import dummy from '../../../assets/img/uploadedimg.png';
import EditMembership from './EditMembership';
import DropdownButton from 'react-bootstrap/DropdownButton';
import RemoveMembership from './RemoveMembership';
import { useAlerts } from '@/Components/Alerts';

const rewards_lists = [
  {
    'title':'Green Circle Insta',
    'value':'green_circle_insta'
  },
  {
    'title':'Insta Broadcast',
    'value':'insta_broadcast'
  },
  {
    'title':'⁠Telegram Group',
    'value':'telegram_group'
  },
  {
    'title':' ⁠X Community ',
    'value':'x_community'
  },
  {
    'title':'⁠Monthly Content Bundle',
    'value':'monthly_content_bundle'
  },
  {
    'title':'Weekly Content Bundle',
    'value':'weekly_content_bundle'
  },
  {
    'title':'⁠Weekly DM chat',
    'value':'weekly_DM_chat'
  },
  {
    'title':'Monthly DM chat',
    'value':'monthly_DM_chat'
  },
  {
    'title':'Monthly Video call',
    'value':'monthly_video_call'
  },
  {
    'title':'Weekly Video call',
    'value':'weekly_video_call'
  },
];

export default function Membership({item, hidebtn, IsloggedIn, fetch_membership}) {
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const gotologin = () => { 
    errorAlert("You must login first.");
    router.visit(`/login?redirect=${`/membership/checkout/${item.uuid}`}`);
  }
  const {auth} = usePage().props;
  const { formatMultiPrice } = PriceFormat();

  const [rewards ,setrewards ] = useState(JSON.parse(item && item.rewards));
  const getRewardTitle = (e) => { 
    const item = rewards_lists.filter((item)=> item.value == e);
    return item && item[0] && item[0].title;
  }

  useEffect(()=>{
    setrewards(JSON.parse(item && item.rewards));
  },[item]);
 
  
  return (
    <>
      <div className=' position-relative membership-box shadow-voilet p-2 box overflow-hidden rounded-lg' >

      {IsloggedIn && item && item.approved === 0 ?  <div className='approvalmessge membership m-3 rounded-3 p-3 py-2 mb-2 ' >Membership waiting for approval. Currently only you can see this membership.</div> : ''}

        <div className='membership-head' >
          <div className='m-imag rounded-lg ' >
            <img src={item && item.perma_link || dummy } alt='image' className='img-fluid w-100' />
          </div>
          <div className='m-detail p-4 pb-3' >
              <h3 className='text-large text-center text-white text-uppercase' >{item && item.level}</h3>
              <h2 className=' text-center text-white ' ><b>{formatMultiPrice(item && item.price, item && item.currency)}</b> per month</h2>
          </div>
            {IsloggedIn ? <DropdownButton
              className='edit-post pe-0 absolute top-5 m-1 right-3 z-1 ' id="dropdown-basic-button"
              title={
              <div className='dots' >
              <span className='bg-dark' ></span>
              <span className='bg-dark' ></span>
              <span className='bg-dark' ></span>
            </div>}>
                <RemoveMembership classes={`px-[18px] py-2 text-start w-full`} updateItems={fetch_membership} uuid={item.uuid} text="Remove" />
            </DropdownButton> : ''} 
        </div>




      <div className='p-2 pt-0' >
        <ul className='lists_rewards mt-3' >
          <li  className='d-flex ' >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.95801 14.9993L3.20801 10.2493L4.39551 9.06185L7.95801 12.6243L15.6038 4.97852L16.7913 6.16602L7.95801 14.9993Z" fill="#F94F97"/>
            </svg> 
            <p className='ps-2'>Access to Member only posts</p>
          </li>
          {rewards && rewards.map((r, i)=>{
            return <li key={`reward-${i}`} className='d-flex ' >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.95801 14.9993L3.20801 10.2493L4.39551 9.06185L7.95801 12.6243L15.6038 4.97852L16.7913 6.16602L7.95801 14.9993Z" fill="#F94F97"/>
                </svg> 
                <p className='ps-2'>{getRewardTitle(r)}</p>
              </li>
          })}
        </ul>
        
          

          {IsloggedIn ? <EditMembership fetch_membership={fetch_membership} item={item} /> : 
            <>
              {auth && auth.user !== null ? 
                <Link className='btn-pink sm mt-3 ' method='get'
                    href={route('membership.checkout',{uuid: item.uuid})}>Join Now
                </Link> 
                :  
                <button className='btn-pink w-full sm mt-3 ' 
                    onClick={gotologin}>Join Now
                </button> 
              }
            </>
          }
      </div>


      </div>
    </>
  )
}
