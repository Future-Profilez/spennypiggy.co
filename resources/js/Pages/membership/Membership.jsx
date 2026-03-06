import { useEffect, Fragment } from "react";
import { useState } from 'react';
import PriceFormat from '@/includes/PriceFormat';
import { Link, router, usePage } from "@inertiajs/react";
import dummy from '../../../assets/img/uploadedimg.png';
import EditMembership from './EditMembership';
import { Menu, Transition } from '@headlessui/react';
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

  const isZeroDecimalCurrency = (curr) => {
    const zeroDecimalCurrencies = [
        'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
        'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
    ];
    return zeroDecimalCurrencies.includes(curr?.toUpperCase());
  };

  const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
    const listedPrice = parseFloat(price || 0);
    const isZeroDecimal = isZeroDecimalCurrency(curr);
    
    // 1. VAT is added to the listed price first
    const vatAmount = listedPrice * (vatPercent || 0) / 100;
    const priceWithVat = listedPrice + vatAmount;

    // 2. Define fee rates
    const stripeFeeRate = 0.029; // 2.9%
    const stripeFixedFee = isZeroDecimal ? 0 : 0.30; // 30 cents (0 for zero-decimal)
    const platformFeeRate = 0.15; // 15%
    const complianceFeeRate = 0.02; // 2%
    const adminFee = 1.00; // Fixed admin fee

    // 3. Gross-up formula:
    // Total = (PriceWithVAT + FixedFees) / (1 - TotalPercentageFees)
    
    const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
    
    if (totalDeductionRate >= 1) {
        // Safety check to avoid division by zero or negative
        return priceWithVat;
    }

    const totalSupporterPays = (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
    
    return totalSupporterPays;
  };

  const isCreator = auth?.user?.id === item?.user_id;
  const vatPercentage = item?.user?.vat_amount_percentage || 0;

  return (
    <>
          <div className={`bg-opacity-90 relative rounded-[25px] md:rounded-[30px]  
            border-[3px] md:border-2 ${borderclasses[item?.level || 'default']} 
            h-full bg-white `}>
                  {IsloggedIn && item && item?.approved === 0 ?
                    <div className='absolute top-8 z-10 m-3 bg-yellow-500 text-[10px] p-2 text-center rounded-[25px] md:rounded-[30px] ' >Membership waiting for approval. Currently only you can see this membership.</div>
                  : ''}
                  
                    {IsloggedIn ?  
                      <Menu as="div" className="absolute top-2 right-2 z-10 m-1">
                        <Menu.Button className="edit-post pr-0 flex items-center justify-center p-2 rounded-full hover:bg-black/10 transition-colors focus:outline-none">
                          <div className='dots flex flex-col gap-[3px]' >
                            <span className='bg-white w-1 h-1 rounded-full' ></span>
                            <span className='bg-white w-1 h-1 rounded-full' ></span>
                            <span className='bg-white w-1 h-1 rounded-full' ></span>
                          </div>
                        </Menu.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-[25px] md:rounded-[30px]  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="px-1 py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <div className={`${active ? 'bg-gray-100' : ''}`}>
                                    <RemoveMembership classes={`px-4 py-2 text-left w-full text-sm text-gray-900`} uuid={item?.uuid} text="Remove" />
                                  </div>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    : ''}
                    <div className={`${membershipclasses[item?.level || 'default']} 
                      rounded-tl-[25px] rounded-tr-[25px] text-white pt-6`}>
                        <div className='m-auto w-16 h-16 !rounded-full overflow-hidden relative' >
                          <img src={item && item?.perma_link || dummy } alt='image' className='!rounded-[30px] md:rounded-[40px]   w-full h-full object-cover  ' />
                        </div>
                        <div className="flex justify-center ">
                          <h2 className={`${btnclasses[item?.level || 'default']} 
                            rounded-[30px] md:rounded-[40px]  px-3 text-sm py-2 text-white uppercase mt-2`}>
                            {item && item?.level}
                          </h2>
                        </div>

                        <div className="flex flex-col items-center justify-center py-4 pt-2 ">
                          <div className="flex items-baseline">
                            <h2 className={`font-bold text-xl`}>
                              {isCreator ? (
                                formatMultiPrice(item && item?.price, item && item?.currency)
                              ) : (
                                formatMultiPrice(
                                  calculateTotalSupporterPays(
                                    item?.price, 
                                    item?.currency,
                                    vatPercentage
                                  ), 
                                  item?.currency
                                )
                              )}
                            </h2>
                            <div className="pl-1">
                              <p className="text-[17px]">/month</p>
                            </div>
                          </div>
                          {!isCreator && (
                            <div className="text-[10px] text-white/80 font-normal mt-1 leading-tight text-center">
                              * Includes all fees
                            </div>
                          )}
                        </div>
                    </div>
                    <div className='p-3'>
                     
                      <p className="font-bold mb-2 ">What's Included</p>
                      <ul className="space-y-1 text-black">
                          {rewards && rewards.map((r, i)=>{
                            return <li key={`reward-${i} `} className=' flex items-center' >
                                ✅ <span className="ml-2 text-sm">{getRewardTitle(r)}</span>
                            </li>
                          })}
                          {/* <li key={`reward-`} className='flex items-center' >
                                ✅ <span className="ml-2 text-sm">Access to Member only posts</span>
                          </li> */}
                      </ul>
                    </div>
                  
                {hidebtn ? '' : <>
                  <div className='flex p-3 pt-0 justify-center items-center'>
                    {IsloggedIn ? 
                      <EditMembership  classes='btn-pink block text-center !w-full'  item={item} /> 
                    :
                      <Link method='get' as="button"
                        href={route('membership.checkout',{uuid: item?.uuid})}
                        className={`${btnclasses[item?.level || 'default']}  block text-center !w-full py-2 rounded-[30px] md:rounded-[40px]  font-bold uppercase shadow-sm hover:opacity-90`}
                      >
                        Join {item?.level}
                      </Link>
                    }
                  </div>
                </>}

                {item.user ?
                <div className="flex px-2 mb-3 justify-center">
                  {item?.user ? (
                    <>
                      <p className="text-xs font-semibold text-black mr-1">
                        By
                      </p>
                      <Link method="get" as="button"
                        href={route('user.show', { username: item.user.username })}
                        className="text-xs text-[#F94F97] underline hover:opacity-90" >
                        @{item.user.username}
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-black mr-1">
                        By @Unavailable
                      </p>
                    </>
                  )}
                </div> : ''
                }
            </div>
    </>
  )
}
