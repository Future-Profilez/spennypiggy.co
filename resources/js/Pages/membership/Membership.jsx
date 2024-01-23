import React from 'react';
import { useState } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link } from "@inertiajs/react";
import dummy from '../../../assets/img/uploadedimg.png';

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

export default function Membership({item, hidebtn}) {

  const { formatMultiPrice } = PriceFormat();

  const [rewards ,setrewards ] = useState(JSON.parse(item && item.rewards));
  const getRewardTitle = (e) => { 
    const item = rewards_lists.filter((item)=> item.value == e);
    return item && item[0] && item[0].title;
  }

  const paynow = () => { 

  }
  
  return (
    <>
      <div className='membership-box shadow-voilet p-2 box overflow-hidden rounded-lg' >
        <div className='membership-head' >
          <div className='m-imag rounded-lg ' >
            <img src={item && item.perma_link || dummy } alt='image' className='img-fluid w-100' />
          </div>
          <div className='m-detail p-4 pb-3' >
              <h3 className='text-large text-center text-white text-uppercase' >{item && item.level}</h3>
              <h2 className=' text-center text-white ' ><b>{formatMultiPrice(item && item.price, item && item.currency)}</b> per month</h2>
          </div>
        </div>

        <ul className='lists_rewards mt-4 px-3' >
          {rewards && rewards.map((r, i)=>{
            return <li key={`reward-${i}`} className='d-flex flex-wrap' >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.95801 14.9993L3.20801 10.2493L4.39551 9.06185L7.95801 12.6243L15.6038 4.97852L16.7913 6.16602L7.95801 14.9993Z" fill="#F94F97"/>
                </svg> 
                &nbsp;  {getRewardTitle(r)}
              </li>
          })}
        </ul>

        <div className='px-3 pt-3' >
          {hidebtn ? '' : 
            <Link className='btn-pink sm mb-3 ' method='get'
                href={route('membership.checkout',{uuid: item.uuid})}>Join Now
            </Link> 
          }
        </div>

      </div>
    </>
  )
}
