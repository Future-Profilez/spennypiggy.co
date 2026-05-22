import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import CheckoutLegalTerms from '@/Components/CheckoutLegalTerms';
import Popup from '@/Components/Popup';

import PriceFormat from '@/includes/PriceFormat';
import formatMultiPrice from '@/includes/PriceFormat';

export default function PiggyPotWidget({ piggyPots, user, global_currency }) {
    if (!piggyPots || piggyPots.length === 0) return null;

    const featuredPot = piggyPots.find(p => p.is_pinned) || piggyPots[0];
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectegTag, setselectegTag] = useState(0);
    
    const { auth } = usePage().props;
    const { errorAlert } = useAlerts();

    const { data, setData } = useForm({
        amount: '',
        currency: featuredPot.currency,
        message: 'Just a small token of appreciation 💖',
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        anonymous: 0,
        digital_waiver: false,
        agree: false,
    });

    const presetAmounts = [25, 30, 35, 40, 45, 50, 75, 85, 99];

    const selectPreset = (val) => {
        setAmount(val);
        setData('amount', val);
        setselectegTag(val);
    };

    const handleCustomAmount = (e) => {
        setAmount(e.target.value);
        setData('amount', e.target.value);
        setselectegTag('custom');
    };

    const handleContribute = async () => {
        if (!data.amount || data.amount < 1) {
            errorAlert("Please enter a valid amount.");
            return;
        }

        if (!data.digital_waiver) {
            errorAlert("Please accept the digital waiver to continue.");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(route('piggy-pot.pay', featuredPot.uuid), data);
            
            if (res.data.status) {
                window.location.href = res.data.url;
            } else if (res.data.card_verification_required) {
                errorAlert(res.data.msg);
                setLoading(false);
            } else if (res.data.step_up) {
                // handle step up if needed (similar to tip)
                errorAlert("Verification required. Please contact support.");
                setLoading(false);
            } else {
                errorAlert(res.data.msg || "Failed to initiate payment.");
                setLoading(false);
            }
        } catch (error) {
            errorAlert(error?.response?.data?.message || "Something went wrong.");
            setLoading(false);
        }
    };

    // Calculate progress for animation
    const progress = 0; // For MVP, wait for progress field if needed

    return (
        <div className="tip-wrapper mb-6">
            <div className='piggyface' dangerouslySetInnerHTML={{ __html: `<svg width="102" height="66" viewBox="0 0 102 66" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.421 28.5332L2.73516 17.5028C-2.4532 12.9902 0.748386 4.31682 7.62534 4.31682L37.1593 4.31682C39.6744 4.31682 41.9772 5.65636 43.1417 7.79441L45.4522 12.0357M84.7744 26.6908L99.6457 16.4851C104.996 12.8123 102.167 4.31682 95.6888 4.31682L62.7237 4.31682C60.2798 4.31682 58.031 5.57865 56.8488 7.61633L54.1952 12.1895" stroke="#FF007F" strokeWidth="6" strokeLinecap="round"/><path d="M60.6726 62.1382C84.4578 57.2514 96.6715 41.5238 95.962 25.5684C95.2526 9.61298 73.1091 -0.916892 48.3308 1.05372C23.5524 3.02434 4.10309 16.8093 4.81255 32.7647C5.52202 48.7201 32.4831 67.9351 60.6726 62.1382Z" fill="#FF007F"/><path d="M30.6868 25.6833C29.2135 25.4385 27.8732 26.313 27.6917 27.6361C27.5103 28.9592 28.5375 30.2294 30.0107 30.4741L30.6868 25.6833ZM39.8134 29.5694C41.1578 29.2801 42.0227 28.1678 41.7451 27.0844C41.4674 26.001 40.1524 25.3577 38.8079 25.647L39.8134 29.5694ZM30.0107 30.4741C33.7224 31.0906 37.3872 30.0911 39.8134 29.5694L38.8079 25.647C36.6575 26.1118 33.6406 26.1741 30.6868 25.6833L30.0107 30.4741Z" fill="#FF8E25"/><path d="M62.6841 22.6101C61.2109 22.3653 59.8705 23.2398 59.689 24.5629C59.5076 25.886 60.5348 27.1563 62.008 27.401L62.6841 22.6101ZM71.8107 26.4962C73.1551 26.2069 74.02 25.0947 73.7424 24.0112C73.4647 22.9278 72.1497 22.2845 70.8053 22.5738L71.8107 26.4962ZM62.008 27.401C65.7198 28.0174 69.3845 27.0179 71.8107 26.4962L70.8053 22.5738C68.6548 23.0386 65.6379 23.1009 62.6841 22.6101L62.008 27.401Z" fill="#FF8E25"/></svg>` }} />
            <div className='piggynose' dangerouslySetInnerHTML={{ __html: `<svg width="51" height="42" viewBox="0 0 51 42" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.1444 41.777C33.7226 41.8796 45.419 35.3475 49.3364 25.8924C53.2538 16.4372 45.4414 7.21804 32.8631 7.11546C20.2849 7.01289 8.58849 13.545 4.67107 23.0001C0.753648 32.4553 8.56612 41.6744 21.1444 41.777Z" fill="#FF8E25"/><path d="M19.1171 27.9103C17.7695 27.8993 16.6575 26.8375 16.6331 25.5387C16.6087 24.2399 17.6812 23.1873 19.0287 23.1983L19.1171 27.9103ZM23.027 23.2309C24.3745 23.2419 25.4866 24.3037 25.511 25.6025C25.5353 26.9013 24.4629 27.9539 23.1153 27.9429L23.027 23.2309ZM19.0287 23.1983L23.027 23.2309L23.1153 27.9429L19.1171 27.9103L19.0287 23.1983Z" fill="#FF007F"/><path d="M32.2223 28.0171C30.8748 28.0062 29.7627 26.9443 29.7383 25.6456C29.714 24.3468 30.7864 23.2942 32.134 23.3051L32.2223 28.0171ZM36.1322 23.3377C37.4798 23.3487 38.5918 24.4105 38.6162 25.7093C38.6406 27.0081 37.5681 28.0607 36.2206 28.0497L36.1322 23.3377ZM32.134 23.3051L36.1322 23.3377L36.2206 28.0497L32.2223 28.0171L32.134 23.3051Z" fill="#FF007F"/></svg>` }} />
            
            <div className={`p-2 md:p-4 box-inner`}>
                <div className='legleft'  dangerouslySetInnerHTML={{ __html: `<svg width="22" height="25" viewBox="0 0 22 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.6133 21.658C3.12563 21.5794 1.99042 20.2783 2.07759 18.7516C2.16476 17.2248 3.44131 16.0511 4.92898 16.1298L4.6133 21.658ZM14.922 16.6575C16.4097 16.7361 17.5449 18.0372 17.4577 19.564C17.3705 21.0907 16.094 22.2644 14.6063 22.1858L14.922 16.6575ZM4.92898 16.1298L14.922 16.6575L14.6063 22.1858L4.6133 21.658L4.92898 16.1298Z" fill="#FF007F"/><path d="M2.58334 11.2335L0.26767 19.8242C-0.347573 22.1066 1.48805 24.3113 4.02047 24.3312L15.4214 24.4208C17.8285 24.4397 19.7891 22.4201 19.4608 20.2526L18.0401 10.8711" stroke="#FF007F" strokeWidth="6" strokeLinecap="round"/></svg>` }} />
                <div className='legright'  dangerouslySetInnerHTML={{ __html: `<svg width="22" height="25" viewBox="0 0 22 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.40578 22.1873C3.91811 22.1087 2.7829 20.8075 2.87007 19.2808C2.95724 17.7541 4.23379 16.5804 5.72146 16.659L5.40578 22.1873ZM15.7145 17.1868C17.2021 17.2654 18.3373 18.5665 18.2502 20.0932C18.163 21.62 16.8864 22.7937 15.3988 22.715L15.7145 17.1868ZM5.72146 16.659L15.7145 17.1868L15.3988 22.715L5.40578 22.1873L5.72146 16.659Z" fill="#FF007F"/><path d="M2.58334 11.2335L0.26767 19.8242C-0.347573 22.1066 1.48805 24.3113 4.02047 24.3312L15.4214 24.4208C17.8285 24.4397 19.7891 22.4201 19.4608 20.2526L18.0401 10.8711" stroke="#FF007F" strokeWidth="6" strokeLinecap="round"/></svg>` }} />
                
                <h2 className='p-3 text-[#FF007F] !font-normal font-GillSans uppercase text-2xl mb-1 mt-4 pr-5'>{featuredPot.title}</h2>
                <div className='border-t border-gray-200 p-3 pt-3' >
                    <p className="text-gray-600 mb-4">{featuredPot.description}</p>
                    
                    {/* Goal Progress */}
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-bold text-gray-700">Target: {featuredPot.currency} {featuredPot.target_amount}</span>
                            <span className="text-sm font-bold text-pink-500">Raised: {featuredPot.currency} {parseFloat(featuredPot.total_raised || 0).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-pink-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, ((featuredPot.total_raised || 0) / featuredPot.target_amount) * 100)}%` }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2 mt-2">
                        {presetAmounts.map((val) => (
                            <button 
                                key={val}
                                onClick={() => selectPreset(val)}
                                className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == val ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`}
                            >
                                <span className='mr-2' dangerouslySetInnerHTML={{ __html: `<svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z" stroke="#FF8E25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.689 6.83997H8.64902C7.94098 6.83997 7.26194 7.12121 6.7613 7.62186C6.26066 8.1225 5.97941 8.80153 5.97941 9.50957C5.97941 10.2176 6.26066 10.8966 6.7613 11.3973C7.26194 11.8979 7.94098 12.1792 8.64902 12.1792H13.351C14.059 12.1792 14.738 12.4604 15.2387 12.9611C15.7393 13.4617 16.0206 14.1407 16.0206 14.8488C16.0206 15.5568 15.7393 16.2358 15.2387 16.7365C14.738 17.2371 14.059 17.5184 13.351 17.5184H7.90902" stroke="#FF8E25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 4.5V20" stroke="#FF8E25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>` }} />
                                {formatMultiPrice(val, user?.default_currency || "GBP")}
                            </button>
                        ))}
                    </div>

                    <p className="!my-4 text-[14px] text-gray-500 font-normal mt-1 leading-tight">
                        *Includes platform and payment processing fees. <br /> You will be charged in {user?.default_currency || 'GBP'}. Amounts shown in {global_currency || user?.default_currency || 'GBP'} are estimates.
                    </p>

                    {selectegTag === 'custom' || amount > 0 ? (
                        <div className="mb-4">
                            <div className="relative currency-wrapper">
                                <span className="currency-tag">{global_currency || 'GBP'}</span>
                                <input 
                                    className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[30px]" 
                                    value={amount}
                                    onChange={handleCustomAmount}
                                    type="number" 
                                    placeholder="Enter custom amount.." 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 text-center">
                            <button className="text-gray-500 font-bold underline" onClick={() => setselectegTag('custom')}>Custom Support</button>
                        </div>
                    )}

                    {amount > 0 && (
                        <>
                            <div className="mb-3 animate-fade-in"> 
                                <textarea 
                                    className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[20px]" 
                                    defaultValue={'Just a small token of appreciation 💖'}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Write a short note." 
                                />
                            </div>

                            {!auth?.user && (
                                <>
                                    <div className="mb-4">
                                        <input required
                                            className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[30px]"
                                            defaultValue={auth?.user?.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            type="text" placeholder="Enter nickname.."
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <input required disabled={!!auth?.user?.email}
                                            className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[30px]"
                                            defaultValue={auth?.user?.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            type="email" placeholder="Enter email.." 
                                        />
                                        <p className='text-sm text-gray-600 mt-1'>Your email address is kept private and will not be shown to anyone.</p>
                                    </div>
                                </>
                            )}

                            {featuredPot.allow_anonymous && (
                                <div className='termselect mt-3 mb-3'>
                                    <label htmlFor="keepanonymous">
                                        <p className='text-[15px] text-gray-900 font-normal'>
                                            <input 
                                                className='w-5 h-5 text-[#FF007F] border-gray-300 rounded focus:ring-pink-500 transition-all cursor-pointer' 
                                                type="checkbox"
                                                id="keepanonymous" 
                                                name="keepanonymous"
                                                onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0)}
                                            /> Keep anonymous
                                        </p>
                                    </label>
                                    <p className="text-gray-700 text-sm mt-1 mb-3">Your personal email and name will be private.</p>
                                </div>
                            )}

                            <CheckoutLegalTerms onAgreeChange={(checked) => {
                                setData('agree', checked);
                                setData('digital_waiver', checked);
                            }} />
                        </>
                    )}

                    <button 
                        onClick={handleContribute}
                        disabled={loading || !amount || amount < 1 || !data.digital_waiver}
                        className={`items-center px-4 shadow-[4px_4px_0px_0px_#FF007F] rounded-[30px] btn-pink md justify-center btn-shadow !font-normal ease-in-out duration-150 flex button text-center w-full mx-auto ${(amount > 0 && data.agree && data.digital_waiver && !loading) ? '' : 'disabled'} font-gulfs`}
                    >
                        {loading ? 'Processing...' : 'Add to Pot'}
                    </button>

                    <div className='securestripe text-center mt-3'>
                        🔒 Secured via <b>Stripe</b>
                    </div>
                </div>
            </div>
        </div>
    );
}
