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
  
  const { auth, platform_fee_percentage, transaction_fee_percentage } = usePage().props;
  const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
  const [rewards ,setrewards ] = useState(item?.rewards ? JSON.parse(item.rewards) : []);
  const getRewardTitle = (e) => {
    const item = rewards_lists.filter((item)=> item?.value == e);
    return item && item[0] && item[0].title;
  }

  useEffect(()=>{
    setrewards(item?.rewards ? JSON.parse(item.rewards) : []);
  },[item]);

  const membershipclasses = {
    'gold' : '!bg-[#FFD700]',
    'silver' : '!bg-[#A6A6A6]',
    'bronze' : '!bg-[#CD7F32]',
    'platinum' : '!bg-[#D3D8E0]',
    'lifetime' : '!bg-[#22c55e]',
  }
  const btnclasses = {
    'gold' : '!bg-yellow-400 !text-black hover:!bg-yellow-500',
    'silver' : '!bg-gray-400 !text-black hover:!bg-gray-500',
    'bronze' : '!bg-[#8B4513] !text-white hover:!bg-[#654321]',
    'platinum' : '!bg-[#E5E4E2] !text-black hover:!bg-[#C0C0C0]',
    'lifetime' : '!bg-[#16a34a] !text-white hover:!bg-[#15803d]',
  }
  const borderclasses = {
    'gold' : '!border-[3px] !border-black',
    'silver' : '!border-[3px] !border-black',
    'bronze' : '!border-[3px] !border-black',
    'platinum' : '!border-[3px] !border-black',
    'lifetime' : '!border-[3px] !border-black',
  }

  const isZeroDecimalCurrency = (curr) => {
    const zeroDecimalCurrencies = [
        'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
        'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
    ];
    return zeroDecimalCurrencies.includes(curr?.toUpperCase());
  };

  const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
    const listedPrice = parseFloat(String(price || 0).replace(/,/g, ''));
    const isZeroDecimal = isZeroDecimalCurrency(curr);
    const vatAmount = listedPrice * (parseFloat(vatPercent) || 0) / 100;
    const priceWithVat = listedPrice + vatAmount;

    // 2. Define fee rates (Constants must match backend configuration in Helpers.php)
    const stripeFeeRate = 0.029;
    const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
    const platformFeeRate = (platform_fee_percentage || 20) / 100; 
    const complianceFeeRate = (transaction_fee_percentage || 2) / 100; 
    const adminFee = adminFeeInCurrency(curr);

    // 3. Gross-up formula:
    // Total = (PriceWithVAT + FixedFees) / (1 - TotalPercentageFees)
    
    const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
    
    if (totalDeductionRate >= 1) {
        // Safety check to avoid division by zero or negative
        return priceWithVat;
    }

    const totalSupporterPays = (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
    
    // Rounding logic to match backend (Helpers.php)
    if (!isZeroDecimal) {
        return Math.ceil(totalSupporterPays * 100) / 100;
    } else {
        return Math.ceil(totalSupporterPays);
    }
  };

  const isCreator = auth?.user?.id === item?.user_id;
  const approvalStatus = item?.approved;
  const editStatus = item?.edited_status;
  const isApprovalPending = approvalStatus === 0 || approvalStatus === '0';
  const isApprovalRejected = approvalStatus === 2 || approvalStatus === '2';
  const hasEditReason = item?.edited_reason && item?.edited_reason.trim() !== '';
  const adminEditReason = hasEditReason ? item?.edited_reason.trim() : '';
  const isEditRequestPending =
    isApprovalPending &&
    hasEditReason &&
    (editStatus === 0 || editStatus === '0' || editStatus === 3 || editStatus === '3');
  const isReEditedPendingApproval =
    isApprovalPending && (editStatus === 1 || editStatus === '1');

  return (
    <div className={`${item?.status == 0 ? 'inactive-item' : ''} h-full`}>
       <div className={`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] 
        hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-[30px] relative 
        border-[3px] border-black bg-white overflow-hidden w-full h-full flex flex-col`}>
                  
                  
                    {IsloggedIn ?  
                      <Menu as="div" className="absolute top-2 right-2 z-10 m-1">
                        <Menu.Button className="edit-post p-2 px-3 flex items-center justify-center p-2 rounded-full hover:bg-black/10 transition-colors focus:outline-none">
                          <div className='dots flex flex-col gap-[0px]' > 
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
                      rounded-tl-[20px]  rounded-tr-[20px] text-black pt-6 !border-b-[3px] !border-r-0 !border-l-0 !border-t-0 border-black`}>
                        <div className='m-auto w-20 h-20 !rounded-full overflow-hidden relative border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' >
                          <img src={item && item?.perma_link || dummy } alt='image' className='!rounded-full w-full h-full object-cover bg-white' />
                        </div>
                        <div className="flex justify-center mt-4">
                          <h2 className={`
                            rounded-full border-[3px] border-black px-4 text-sm font-black py-1 text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white`}>
                            {item && item?.level}
                          </h2>
                        </div>

                        <div className="flex flex-col items-center justify-center py-4 pt-4 ">
                          <div className="flex items-baseline">
                            <h2 className={`font-black text-2xl`}>
                              {isCreator ? (
                                formatMultiPrice(item && item?.price, item && item?.currency)
                              ) : (
                                formatMultiPrice(
                                  calculateTotalSupporterPays(
                                    item?.price, 
                                    item?.currency,
                                    item?.user?.vat_amount_percentage || 0
                                  ), 
                                  item?.currency
                                )
                              )}
                            </h2>
                            <div className="pl-1">
                              <p className="text-[17px] font-bold">/month</p>
                            </div>
                          </div>
                          {!isCreator && (
                            <div className="text-[10px] text-black font-bold mt-1 leading-tight text-center">
                              *Includes platform and payment processing fees
                            </div>
                          )}
                        </div>
                    </div>

                    <div className='p-5  flex-grow'>
                     
                     {IsloggedIn && item ? (
                        isEditRequestPending ? (
                          <div className="text-red-500 text-[11px] pb-2 text-left ">
                            <p className="font-bold">Admin requested edits</p>
                            <p>
                              {adminEditReason || 'Please update this membership and save it again for re-verification.'}
                            </p>
                          </div>
                        ) : isReEditedPendingApproval ? (
                          <div className="text-blue text-[11px] pb-2 text-">
                            Membership updated and submitted for re-verification. Currently only you can see this membership.
                          </div>
                        ) : isApprovalPending ? (
                          <div className="text-yellow-500 text-[11px] pb-2 text-">
                            Membership waiting for approval. Currently only you can see this membership.
                          </div>
                        ) : isApprovalRejected ? (
                          <div className="text-red-500 text-[11px] pb-2 text-left ">
                            <p className="font-bold">Membership rejected by admin.</p>
                            {adminEditReason ? <p>{adminEditReason}</p> : ''}
                          </div>
                        ) : (
                          ''
                        )
                      ) : ''}
                      
                      <p className="font-black text-lg mb-3 text-black">What's Included</p>
                      <ul className="space-y-2 text-black font-bold">
                          {rewards && rewards.map((r, i)=>{
                            return <li key={`reward-${i} `} className=' flex items-start' >
                                <span className="bg-green-400 text-black border-2 border-black rounded-md w-5 h-5 flex items-center justify-center text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0 mt-0.5">✓</span> <span className="ml-3 text-sm">{getRewardTitle(r)}</span>
                            </li>
                          })}
                      </ul>
                    </div>
                  
                {hidebtn ? '' : <>
                  <div className='flex p-5 pt-0  rounded-bl-[20px] rounded-br-[20px] justify-center items-center mt-auto'>
                    {IsloggedIn ? 
                      <EditMembership  classes='bg-yellow-300 border-[3px] border-black text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all block text-center !w-full py-3 rounded-xl'  item={item} /> 
                    :
                      <Link method='get' as="button"
                        href={route('membership.checkout',{uuid: item?.uuid})}
                        className={`${btnclasses[item?.level || 'default']} border-[3px] border-black block text-center !w-full py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all`}
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
                      <p className="text-xs font-black text-black mr-1 uppercase">
                        By
                      </p>
                      <Link method="get" as="button"
                        href={route('user.show', { username: item.user.username })}
                        className="text-xs text-pink-600 font-black uppercase underline hover:opacity-90" >
                        @{item.user.username}
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-black text-gray-500 uppercase">
                        Creator Unavailable
                      </p>
                    </>
                  )}
                </div> : ''
                }
            </div>
    </div>
  )
}
