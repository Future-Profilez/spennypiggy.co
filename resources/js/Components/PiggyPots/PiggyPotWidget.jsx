import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import CheckoutLegalTerms from '@/Components/CheckoutLegalTerms';
import Popup from '@/Components/Popup';
import {tipheading} from '@/includes/Icons';

import PriceFormat from '@/includes/PriceFormat';

export default function PiggyPotWidget({ piggyPots, user, global_currency }) {
    if (!piggyPots || piggyPots.length === 0) return null;

    const { formatMultiPrice } = PriceFormat();

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

    const presetAmounts = [25, 50, 75, 100];

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
        <div className="mb-6 relative z-10">
            <div className="p-2 md:p-4 bg-white rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative z-10">
                <div className='p-3 pt-4'>
                    {featuredPot.cover_media && (
                        <div className="mb-4 rounded-2xl overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <img src={featuredPot.cover_media} alt={featuredPot.title} className="w-full max-h-[250px] object-cover" />
                        </div>
                    )}
                    <h2 className='text-[#FF007F] font-normal font-GillSans uppercase text-2xl md:text-3xl mb-1'>{featuredPot.title}</h2>
                    <p className="text-gray-600 mb-5 text-sm font-medium leading-tight">{featuredPot.description}</p>
                    <div className='' >
                        {/* Goal Progress */}
                    <div className="mb-6 bg-gray-50 p-4 rounded-[30px] border border-gray-200 relative">
                        {(featuredPot.total_raised || 0) / 100 >= featuredPot.target_amount && (
                            <div className="absolute -top-3 -right-3 text-2xl animate-bounce">🎉</div>
                        )}
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Target: {featuredPot.currency} {featuredPot.target_amount}</span>
                            <span className="text-sm font-bold text-pink-500 uppercase tracking-wider">Raised: {featuredPot.currency} {parseFloat((featuredPot.total_raised || 0)/100).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 border border-gray-300 overflow-hidden relative">
                            {/* Milestone Markers */}
                            <div className="absolute left-1/4 top-0 bottom-0 w-px bg-white/50 z-10" title="25%"></div>
                            <div className="absolute left-2/4 top-0 bottom-0 w-px bg-white/50 z-10" title="50%"></div>
                            <div className="absolute left-3/4 top-0 bottom-0 w-px bg-white/50 z-10" title="75%"></div>
                            
                            <div className="bg-pink-500 h-4 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, (((featuredPot.total_raised || 0)/100) / featuredPot.target_amount) * 100)}%` }}></div>
                        </div>
                    </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-2 mt-2">
                            {presetAmounts.map((val) => (
                                <button 
                                    key={val}
                                    onClick={() => selectPreset(val)}
                                    className={`border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${ selectegTag == val ? 'pinkbg text-white' : 'bg-gray-200'} rounded-[16px] p-2 px-3 text-center justify-center flex items-center !text-[16px] !font-bold`}
                                >
                                    <span className='mr-2' dangerouslySetInnerHTML={{ __html: tipheading }} />
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
                                    <span className="currency-tag !font-bold text-gray-700">{global_currency || 'GBP'}</span>
                                    <input 
                                        className="border-2 border-black px-4 py-3 pl-14 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-lg font-bold" 
                                        value={amount}
                                        onChange={handleCustomAmount}
                                        type="number" 
                                        placeholder="Enter custom amount.." 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 text-center">
                            <button className="text-gray-500 font-bold border-b-2 border-gray-400 hover:text-black hover:border-black transition-colors" onClick={() => setselectegTag('custom')}>Or enter a custom amount</button>
                        </div>
                        )}

                        {amount > 0 && (
                            <>
                                <div className="mb-3 animate-fade-in"> 
                                    <textarea 
                                        className="border-2 border-black px-4 py-3 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                        defaultValue={'Just a small token of appreciation 💖'}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Write a short note." 
                                    />
                                </div>

                                {!auth?.user && (
                                    <>
                                        <div className="mb-4">
                                            <input required
                                                className="border-2 border-black px-4 py-3 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                defaultValue={auth?.user?.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                type="text" placeholder="Enter nickname.."
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <input required disabled={!!auth?.user?.email}
                                                className="border-2 border-black px-4 py-3 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                defaultValue={auth?.user?.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                type="email" placeholder="Enter email.." 
                                            />
                                            <p className='text-sm text-gray-600 mt-2 font-medium'>Your email address is kept private and will not be shown to anyone.</p>
                                        </div>
                                    </>
                                )}

                                {featuredPot.allow_anonymous && (
                                    <div className='termselect mt-3 mb-3'>
                                        <label htmlFor="keepanonymous">
                                            <div className='flex items-center cursor-pointer'>
                                                <div className="relative mr-3">
                                                    <input 
                                                        type="checkbox"
                                                        id="keepanonymous" 
                                                        name="keepanonymous"
                                                        className="sr-only"
                                                        onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0)}
                                                    />
                                                    <div className={`block w-12 h-7 rounded-full border-2 border-black transition-colors ${data.anonymous ? 'bg-[#FF007F]' : 'bg-gray-300'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full border-2 border-black transition-transform ${data.anonymous ? 'transform translate-x-5' : ''}`}></div>
                                                </div>
                                                <span className='text-[16px] text-gray-900 font-bold'>Keep anonymous</span>
                                            </div>
                                        </label>
                                        <p className="text-gray-700 text-sm mt-2 mb-3 ml-[60px] font-medium">Your personal email and name will be private.</p>
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
        </div>
    );
}
