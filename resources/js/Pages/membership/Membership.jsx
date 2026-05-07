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
    const platformFeeRate = (platform_fee_percentage || 17) / 100; 
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

  const tierThemes = {
    'gold': {
      bg: 'bg-[#FFD700]',
      accent: 'bg-yellow-400',
      text: 'text-black',
      border: 'border-black',
      shadow: 'shadow-yellow-600/20'
    },
    'silver': {
      bg: 'bg-[#E5E7EB]',
      accent: 'bg-gray-400',
      text: 'text-black',
      border: 'border-black',
      shadow: 'shadow-gray-400/20'
    },
    'bronze': {
      bg: 'bg-[#F97316]',
      accent: 'bg-[#CD7F32]',
      text: 'text-white',
      border: 'border-black',
      shadow: 'shadow-orange-900/20'
    },
    'platinum': {
      bg: 'bg-[#F3F4F6]',
      accent: 'bg-[#D1D5DB]',
      text: 'text-black',
      border: 'border-black',
      shadow: 'shadow-slate-400/20'
    },
    'lifetime': {
      bg: 'bg-[#22C55E]',
      accent: 'bg-green-600',
      text: 'text-white',
      border: 'border-black',
      shadow: 'shadow-green-900/20'
    },
    'default': {
      bg: 'bg-white',
      accent: 'bg-pink-500',
      text: 'text-black',
      border: 'border-black',
      shadow: 'shadow-pink-500/20'
    }
  }

  const isCreator = auth?.user?.id === item?.user_id;
  const theme = tierThemes[item?.level?.toLowerCase()] || tierThemes.default;

  return (
    <div className={`${item?.status == 0 ? 'inactive-item' : ''} h-full group/card`}>
       <div className={`relative flex flex-col h-full bg-white rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 overflow-hidden`}>
          
          {/* Header Section */}
          <div className="p-6 relative bg-[#fdfbf7]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black rounded-full mb-3 w-max ${theme.bg} ${theme.text} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                  Tier
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none text-gray-900">{item?.level}</h3>
              </div>
              <div className="w-14 h-14 rounded-2xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden shrink-0 group-hover/card:-rotate-3 transition-transform">
                <img src={item?.perma_link || dummy} alt={item?.level} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black tracking-tighter text-black">
                {isCreator ? (
                  formatMultiPrice(item?.price, item?.currency)
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
              </span>
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">/ mo</span>
            </div>
            
            {IsloggedIn && (
              <div className="absolute top-4 right-4">
                <Menu as="div" className="relative">
                  <Menu.Button className="p-1.5 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors">
                    <div className='flex gap-[3px]'> 
                      <span className='bg-black w-1 h-1 rounded-full'></span>
                      <span className='bg-black w-1 h-1 rounded-full'></span>
                      <span className='bg-black w-1 h-1 rounded-full'></span>
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
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 focus:outline-none overflow-hidden">
                      <div className="p-1">
                        <Menu.Item>
                          {({ active }) => (
                            <RemoveMembership classes={`w-full text-left px-3 py-2.5 text-xs font-black uppercase rounded-lg ${active ? 'bg-red-50 text-red-600' : 'text-gray-900 hover:bg-gray-100'}`} uuid={item?.uuid} text="Cancel Membership" />
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-0 border-t-[3px] border-black border-dashed opacity-20 mx-6"></div>

          {/* Body Section - Perks */}
          <div className="p-6 flex-grow flex flex-col bg-[#fdfbf7]">
            <div className="flex-grow">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Includes:</h4>
              
              <ul className="space-y-3">
                {rewards && rewards.length > 0 ? (
                  rewards.map((r, i) => (
                    <li key={`reward-${i}`} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 text-pink-500">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className="text-sm font-bold text-gray-700 leading-snug">{getRewardTitle(r)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm font-bold text-gray-500 italic">Standard Access Benefits</li>
                )}
              </ul>
            </div>

            {/* Footer Action */}
            <div className="mt-8">
              {IsloggedIn ? (
                <EditMembership classes='w-full py-3.5 bg-white border-[3px] border-black text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all' item={item} />
              ) : (
                <Link 
                  method='get' as="button"
                  href={route('membership.checkout', {uuid: item?.uuid})}
                  className={`w-full py-3.5 ${theme.bg} ${theme.text} border-[3px] border-black font-black uppercase text-xs tracking-widest rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2`}
                >
                  Join Tier
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </Link>
              )}
              
              {item.user && (
                <div className="mt-4 text-center">
                  <Link href={route('user.show', { username: item.user.username })} className="text-[10px] font-bold uppercase text-gray-400 hover:text-pink-600 transition-colors tracking-widest">
                    @{item.user.username}
                  </Link>
                </div>
              )}
            </div>
          </div>
       </div>
    </div>
  )
}
