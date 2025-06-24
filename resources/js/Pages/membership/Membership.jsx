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

export default function Membership({item, hidebtn, IsloggedIn }) {
  const { successAlert, errorAlert, errorsHandling } = useAlerts();
  const gotologin = () => {
    errorAlert("You must login first.");
    router.visit(`/login?redirect=${`/membership/checkout/${item?.uuid}`}`);
  }
  const {auth} = usePage().props;
  const { formatMultiPrice } = PriceFormat();

  const [rewards ,setrewards ] = useState(JSON.parse(item && item?.rewards));
  const getRewardTitle = (e) => {
    const item = rewards_lists.filter((item)=> item?.value == e);
    return item && item[0] && item[0].title;
  }

  useEffect(()=>{
    setrewards(JSON.parse(item && item?.rewards));
  },[item]);


  return (
    <>
            <div class="bg-white bg-opacity-90 relative rounded-[30px] overflow-hidden  border-3 md:border-4 !border-[#F94F97] h-full">
              <div className='m-imag rounded-lg relative ' >
                {IsloggedIn && item && item?.approved === 0 ?  
                <div className='absolute bottom-2 m-3 bg-yellow-500 text-sm p-2 text-center rounded-[20px]' >Membership waiting for approval. Currently only you can see this membership.</div> 
                : ''}
                <img src={item && item?.perma_link || dummy } alt='image' className='max-h-[200px] img-fluid w-100  ' />
              </div>

              <div className='p-3'>
                {IsloggedIn ? <DropdownButton
                  className='edit-post pe-0 absolute top-2 m-1 right-2 z-1 ' id="dropdown-basic-button"
                  title={
                  <div className='dots' >
                  <span className='bg-white' ></span>
                  <span className='bg-white' ></span>
                  <span className='bg-white' ></span>
                </div>}>
                  <RemoveMembership classes={`px-[18px] py-2 text-start w-full`}   uuid={item?.uuid} text="Remove" />
                </DropdownButton> : ''}
                <h2 class="text-xl text-black font-bold uppercase mt-2">{item && item?.level}</h2>
                <p class="text-2xl font-extrabold mb-6">{formatMultiPrice(item && item?.price, item && item?.currency)}  <span class="text-sm">Monthly</span></p>
                <ul class="space-y-1 mb-6">
                    <li key={`reward-${i} `} className='flex items-center' >
                        ✅ <span class="ml-2 text-sm">Access to Member only posts</span>
                    </li>
                    {rewards && rewards.map((r, i)=>{
                      return <li key={`reward-${i} `} className='flex items-center' >
                        ✅ <span class="ml-2 text-sm">{getRewardTitle(r)}</span>
                      </li>
                    })}
                </ul>
                {hidebtn ? '' : <>
                  <div className='flex justify-center items-center'>
                    {IsloggedIn ? <EditMembership  classes='btn-pink mt-2 block text-center !w-full'  item={item} /> :
                      <>
                        {auth && auth.user !== null ?
                          <Link className='btn-pink mt-2  text-center !w-full' method='get'
                              href={route('membership.checkout',{uuid: item?.uuid})}>Join Now
                          </Link>
                          :
                          <button className='btn-pink mt-2 block text-center !w-full'
                              onClick={gotologin}>Join Now
                          </button>
                        }
                      </>
                    }
                  </div>
                </>}
              </div>

            </div>
    </>
  )
}
