import { useEffect } from "react";
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
  const [rewards ,setrewards ] = useState(item?.rewards ? JSON.parse(item.rewards) : []);
  const getRewardTitle = (e) => {
    const item = rewards_lists.filter((item)=> item?.value == e);
    return item && item[0] && item[0].title;
  }

  useEffect(()=>{
    setrewards(item?.rewards ? JSON.parse(item.rewards) : []);
  },[item]);

  const membershipclasses = {
    'gold' : '!border-[#F94F97] !bg-yellow-500',
    'silver' : '!border-[#A6A6A6] !bg-[#A6A6A6]',
    'bronze' : '!border-[#CD7F32] !bg-[#CD7F32]',
    'platinum' : '!border-gray-300 !bg-gray-300',
    'lifetime' : '!border-[#F94F97] !bg-green-500',
  }
  const btnclasses = {
    'gold' : 'bg-yellow-100 !text-yellow-600',
    'silver' : '!bg-gray-500 !text-white',
    'bronze' : '!bg-yellow-800 !text-white',
    'platinum' : '!bg-[#E5E4E2] !text-black',
    'lifetime' : '!bg-green-600 !text-white',
  }
  const borderclasses = {
    'gold' : '!border-yellow-600',
    'silver' : '!border-[#A6A6A6]',
    'bronze' : '!border-[#CD7F32]',
    'platinum' : '!border-[#E5E4E2]',
    'lifetime' : '!border-green-500',
  }

  return (
    <>
          <div className={`bg-opacity-90 relative rounded-[30px] 
            border-3 md:border-4 ${borderclasses[item?.level || 'default']} 
            h-full bg-white `}>
                  {IsloggedIn && item && item?.approved === 0 ?
                    <div className='absolute top-8 z-1 m-3 bg-yellow-500 text-[10px] p-2 text-center rounded-[20px]' >Membership waiting for approval. Currently only you can see this membership.</div>
                  : ''}
                  <Link className='block' method='get'
                    href={route('membership.checkout',{uuid: item?.uuid})}>
                    {IsloggedIn ?  
                      <DropdownButton
                        className='edit-post pe-0 absolute top-2 m-1 right-2 z-1 ' id="dropdown-basic-button"
                        title={
                        <div className='dots' >
                        <span className='bg-white' ></span>
                        <span className='bg-white' ></span>
                        <span className='bg-white' ></span>
                      </div>}>
                      <div> 
                      </div>
                        <RemoveMembership classes={`px-[18px] py-2 text-start w-full`}   uuid={item?.uuid} text="Remove" />
                      </DropdownButton> 
                    : ''}
                    <div className={`${membershipclasses[item?.level || 'default']} rounded-[26px]  text-white pt-6`}>
                        <div className='m-auto w-16 h-16 !rounded-full overflow-hidden 
                        relative' >
                          <img src={item && item?.perma_link || dummy } alt='image' className='!rounded-[30px]  w-full h-full img-fluid object-cover  ' />
                        </div>
                        <div className="flex justify-center ">
                          <h2 className={`${btnclasses[item?.level || 'default']} 
                            rounded-xl px-3 text-sm py-2 text-white uppercase mt-2`}>
                            {item && item?.level}
                          </h2>
                        </div>

                        <div className="flex items-baseline  justify-center py-4 pt-2 ">
                          <h2 className={`font-bold text-xl`}>
                            {formatMultiPrice(item && item?.price, item && item?.currency)}
                          </h2>
                          <div className="ps-1">
                            <p className="text-[17px]">/month</p>
                          </div>
                        </div>
                    </div>
                    <div className='p-3'>
                      <p className="font-bold mb-2 ">What's Included</p>
                      <ul className="space-y-1 text-black">
                          {rewards && rewards.map((r, i)=>{
                            return <li key={`reward-${i} `} className='fading flex items-center' >
                                ✅ <span className="ml-2 text-sm">{getRewardTitle(r)}</span>
                            </li>
                          })}
                          {/* <li key={`reward-`} className='flex items-center' >
                                ✅ <span className="ml-2 text-sm">Access to Member only posts</span>
                          </li> */}
                      </ul>
                    </div>
                  </Link>

                {hidebtn ? '' : <>
                  <div className='flex p-3 pt-0 justify-center items-center'>
                    {IsloggedIn ? 
                      <EditMembership  classes='btn-pink block text-center !w-full'  item={item} /> 
                    :
                      ''
                    }
                  </div>
                </>}
            </div>
    </>
  )
}
