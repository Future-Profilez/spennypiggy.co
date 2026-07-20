import React, { useEffect, useState } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import CheckoutLegalTerms from '@/Components/CheckoutLegalTerms';
import PaymentMethodSelector from '@/Components/PaymentMethodSelector';
import Popup from '@/Components/Popup';
import {tipheading} from '@/includes/Icons';
import PriceFormat from '@/includes/PriceFormat';
import confetti from 'canvas-confetti';

export default function PiggyPotWidget({ piggyPots, user, global_currency, inPopup, feed }) {
    if (!piggyPots || piggyPots.length === 0) return null;

    const { formatMultiPrice } = PriceFormat();

    const featuredPot = piggyPots.find(p => p.is_pinned) || piggyPots[0];
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectegTag, setselectegTag] = useState(0);
    const [activeTab, setActiveTab] = useState('top');
    
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
        payment_method: 'card',
    });

    const presetAmounts = [25, 50, 75];

    const selectPreset = (val) => {
        setAmount(val);
        setData('amount', val);
        setselectegTag(val);
    };

    const [step, setStep] = useState(1); // 1: Amount, 2: Details (Message/User info), 3: Terms & Pay

    const handleCustomAmount = (e) => {
        setAmount(e.target.value);
        setData('amount', e.target.value);
        setselectegTag('custom');
    };

    const handleNextStep = () => {
        if (step === 1) {
            const n = parseFloat(amount);
            if (!n || n < 1) {
                errorAlert("Please select or enter a valid amount first.");
                return;
            }
            if (remainingAmount <= 0) {
                errorAlert("This goal is already completed.");
                return;
            }
            if (n > remainingAmount) {
                errorAlert(`Max you can add right now is ${formatMultiPrice(remainingAmount, user?.default_currency || "GBP")}.`);
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!auth?.user && (!data.name || !data.email)) {
                errorAlert("Please enter your name and email.");
                return;
            }
            setStep(3);
        }
    };

    const handleContribute = async () => {
        const n = parseFloat(data.amount);
        if (!n || n < 1) {
            errorAlert("Please enter a valid amount.");
            return;
        }
        if (remainingAmount <= 0) {
            errorAlert("This goal is already completed.");
            return;
        }
        if (n > remainingAmount) {
            errorAlert(`Max you can add right now is ${formatMultiPrice(remainingAmount, user?.default_currency || "GBP")}.`);
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
    const targetAmount = parseFloat(featuredPot.target_amount || 1);
    const raisedAmount = parseFloat(featuredPot.total_raised || 0);
    const progressPercent = Math.min(100, (raisedAmount / targetAmount) * 100);
    const remainingAmount = Math.max(0, parseFloat((targetAmount - raisedAmount).toFixed(2)));
    const isComplete = remainingAmount <= 0 || progressPercent >= 100;
    const featuredCreatorId = featuredPot.creator_id || featuredPot.creator?.id || featuredPot.user?.id || featuredPot.user_id;
    const isCreator = auth?.user?.id && featuredCreatorId && auth.user.id === featuredCreatorId;
    const shouldCelebrate = !!featuredPot?.is_pinned && isComplete && !inPopup;
    
    const currencySymbol = user?.default_currency === 'USD' ? '$' : '£';
    const statusLabel = isComplete ? 'Completed' : (featuredPot?.status || 'active');
    const statusBadgeClass = isComplete
        ? 'bg-[#FFD700] text-black'
        : statusLabel === 'active'
            ? 'bg-[#A2E4B8] text-black'
            : statusLabel === 'moderation_hold'
                ? 'bg-red-200 text-black'
                : 'bg-gray-200 text-gray-800';

    useEffect(() => {
        if (!shouldCelebrate) return;
        try {
            const key = `pp_celebrated_${featuredPot.uuid}`;
            if (sessionStorage.getItem(key) === '1') return;
            sessionStorage.setItem(key, '1');
            setTimeout(() => {
                confetti({
                    particleCount: 120,
                    spread: 90,
                    origin: { y: 0.35 },
                    colors: ['#FF007F', '#FFD700', '#8b5cf6', '#3b82f6']
                });
            }, 350);
        } catch (e) {}
    }, [shouldCelebrate, featuredPot?.uuid]);

    return (
        <div className="w-full flex mb-2 relative z-10">
            {/* Top Card: Pot Details & Contribute */}
            <div className={`w-full ${inPopup ? '' : "cursor-pointer bg-white rounded-[30px]  border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6 lg:p-8"} `}>
                <div className="">
                    {/* Left: Image */}
                    <div className="w-full   relative">
                        <div className="absolute -top-3 -left-3 bg-[#FFD700] text-black px-4 py-1.5 rounded-full border-[3px] border-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 flex items-center gap-1 uppercase tracking-wide">
                            🎯 CONTENT GOAL
                        </div>
                        <div className="w-full h-52 md:h-56  bg-[#0d1b2a] rounded-[20px] border-[3px] border-black overflow-hidden relative shadow-[inset_0px_0px_20px_rgba(0,0,0,0.5)]">
                            <img src={featuredPot.cover_media || "https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/"} alt={featuredPot.title} className="w-full h-full object-cover opacity-90" />
                        </div>
                    </div>

                    {/* Right: Content & Actions */}
                    <div className="w-full   flex flex-col justify-center">
                        <h2 className="font-gulfs text-2xl md:text-3xl lg:text-3xl mt-3 uppercase text-black tracking-wide">{featuredPot.title}</h2>
                        <p className="text-sm md:text-base text-gray-500 mb-3 line-clamp-1">{featuredPot.description}</p>  
                        <div className="flex justify-between items-end mb-2">
                            <div className="font-bold text-gray-500 text-xs md:text-sm uppercase tracking-widest">Target: {currencySymbol}{targetAmount.toFixed(2)}</div>
                            <div className="font-black text-[#e85d9a] text-sm md:text-lg uppercase tracking-widest">Progress: {currencySymbol}{raisedAmount.toFixed(2)}</div>
                        </div>
                        <div className="flex justify-between items-center mb-2 gap-3">
                            <div className="font-bold text-gray-500 text-xs md:text-sm uppercase tracking-widest">
                                Remaining: {currencySymbol}{remainingAmount.toFixed(2)}
                            </div>
                            <div className={`font-black text-xs md:text-sm uppercase tracking-widest px-3 py-1 rounded-full border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusBadgeClass}`}>
                                {isComplete ? '✓ COMPLETED' : statusLabel}
                            </div>
                        </div>
                        
                        <div className="w-full bg-white h-4 md:h-5 rounded-full border-[3px] border-black overflow-hidden mb-6 shadow-[inset_0_2px_0_rgba(0,0,0,0.1)]">
                            <div
                                className={`${isComplete ? 'bg-[#FFD700]' : 'bg-[#e85d9a]'} h-full transition-all duration-1000 ease-out`}
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>

                        {step === 1 && (
                            isCreator ? (
                                <div className="animate-fade-in space-y-4 rounded-[30px] border-[3px] border-black p-6 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-gray-700 text-base font-bold">
                                        You are the creator of this content. Creators cannot purchase their own content.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        To update pot details, use the edit page below.
                                    </p>
                                    <Link
                                        href={route('piggy-pots.index')}
                                        className="inline-flex w-full justify-center py-3 rounded-full border-[3px] border-black bg-[#FFD700] text-black font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#f5c72f]"
                                    >
                                        Edit Piggy Pot
                                    </Link>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                                        {presetAmounts.map(val => {
                                            const disabled = isComplete || remainingAmount <= 0 || val > remainingAmount;
                                            return (
                                            <button 
                                                key={val}
                                                onClick={() => selectPreset(val)}
                                                disabled={disabled}
                                                className={`flex-1 min-w-[60px] py-2 md:py-3 rounded-[20px] border-[3px] border-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${disabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : (selectegTag === val ? 'bg-[#FFD700] active:translate-y-1 active:translate-x-1 active:shadow-none' : 'bg-white hover:bg-gray-50 active:translate-y-1 active:translate-x-1 active:shadow-none')}`}
                                            >
                                                {formatMultiPrice(val, user?.default_currency || "GBP")}
                                            </button>
                                        )})}
                                        <button 
                                            onClick={() => {
                                                setselectegTag('custom');
                                                setAmount('');
                                                setData('amount', '');
                                            }}
                                            disabled={isComplete || remainingAmount <= 0}
                                            className={`px-3  py-1 md:py-3 rounded-[20px] border-[3px] border-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all ${selectegTag === 'custom' ? 'bg-[#FFD700]' : 'bg-white hover:bg-gray-50'}`} >
                                            CUSTOM
                                        </button>
                                    </div>
                                    
                                    {selectegTag === 'custom' && (
                                        <div className="relative flex items-center mb-4 animate-fade-in">
                                            <span className="absolute left-5 font-black text-gray-700">{global_currency || 'GBP'}</span>
                                            <input 
                                                className="w-full border-[3px] border-black px-4 py-3 pl-16 rounded-[20px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black text-lg focus:outline-none focus:ring-0 focus:border-pink-500"
                                                value={amount}
                                                onChange={handleCustomAmount}
                                                type="number" 
                                                min="1"
                                                max={remainingAmount > 0 ? remainingAmount : undefined}
                                                placeholder="Enter amount" 
                                                disabled={isComplete || remainingAmount <= 0}
                                            />
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleNextStep}
                                        disabled={isComplete || remainingAmount <= 0 || !amount || parseFloat(amount) < 1 || parseFloat(amount) > remainingAmount}
                                        className={`w-full py-2 md:py-4 rounded-[30px]  border-[3px] border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${(isComplete || remainingAmount <= 0 || !amount || parseFloat(amount) < 1 || parseFloat(amount) > remainingAmount) ? 'bg-gray-300 text-white cursor-not-allowed' : 'bg-[#e85d9a] text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none'}`}
                                    >
                                        {isComplete ? 'GOAL COMPLETED' : 'Unlock Content'}
                                    </button>
                                </div>
                            )
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-black text-sm uppercase">Your Details</h4>
                                    <button onClick={() => setStep(1)} className="text-xs font-bold text-gray-500 hover:text-black underline">Back to Amount</button>
                                </div>
                                
                                <textarea 
                                    className="w-full border-[3px] border-black px-4 py-3 rounded-[16px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm focus:outline-none focus:ring-0 focus:border-pink-500"
                                    defaultValue={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Write a short note." 
                                />

                                {!auth?.user && (
                                    <>
                                        <input required
                                            className="w-full border-[3px] border-black px-4 py-3 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm focus:outline-none focus:ring-0 focus:border-pink-500"
                                            defaultValue={auth?.user?.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            type="text" placeholder="Enter nickname.."
                                        />
                                        <div>
                                            <input required disabled={!!auth?.user?.email}
                                                className="w-full border-[3px] border-black px-4 py-3 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm focus:outline-none focus:ring-0 focus:border-pink-500 disabled:bg-gray-200"
                                                defaultValue={auth?.user?.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                type="email" placeholder="Enter email.." 
                                            />
                                            <p className='text-xs text-gray-500 mt-1 font-bold px-2'>Your email address is kept private.</p>
                                        </div>
                                    </>
                                )}

                                {featuredPot.allow_anonymous && (
                                    <label className="flex items-center cursor-pointer gap-3 px-1 mt-1">
                                        <div className="relative">
                                            <input 
                                                type="checkbox"
                                                className="sr-only"
                                                onChange={(e) => setData("anonymous", e.target.checked ? 1 : 0)}
                                            />
                                            <div className={`block w-10 h-6 rounded-full border-[3px] border-black transition-colors ${data.anonymous ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full border-[3px] border-black transition-transform ${data.anonymous ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="font-bold text-sm">Keep anonymous</span>
                                    </label>
                                )}

                                <button 
                                    onClick={handleNextStep}
                                    disabled={!auth?.user && (!data.name || !data.email)}
                                    className={`w-full mt-2 py-3 rounded-full border-[3px] border-black font-black text-lg uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${(!auth?.user && (!data.name || !data.email)) ? 'bg-pink-300 text-white cursor-not-allowed' : 'bg-[#e85d9a] text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none'}`}
                                >
                                    CONTINUE
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col animate-fade-in">
                                <div className="flex justify-between items-center  pb-3">
                                    <h4 className="font-black text-lg uppercase">Final Step</h4>
                                    <button onClick={() => setStep(2)} className="text-xs font-bold text-gray-500 hover:text-black underline">Back</button>
                                </div>
                                
                                <div className="flex justify-between items-center font-black text-lg">
                                    <span>Purchase Amount:</span>
                                    <span className="text-[#e85d9a]">{global_currency || 'GBP'} {amount}</span>
                                </div>

                                <PaymentMethodSelector
                                    amount={parseFloat(data.amount) || 0}
                                    currency={featuredPot.currency || 'GBP'}
                                    email={data.email || auth?.user?.email}
                                    value={data.payment_method}
                                    onChange={(m) => setData('payment_method', m)}
                                    className="mb-2"
                                />

                                <CheckoutLegalTerms onAgreeChange={(checked) => {
                                    setData('agree', checked);
                                    setData('digital_waiver', checked);
                                }} />

                                <button 
                                    onClick={handleContribute}
                                    disabled={loading || !data.digital_waiver}
                                    className={`w-full py-1 md:py-4 rounded-full border-[3px] border-black font-black text-normal uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${(!data.digital_waiver || loading) ? 'bg-pink-300 text-white cursor-not-allowed' : 'bg-[#e85d9a] text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none'}`}
                                >
                                    {loading ? 'Processing...' : 'UNLOCK CONTENT'}
                                </button>
                                <div className="mt-2 text-center text-xs font-bold text-gray-500">
                                    🔒 Secured via Stripe
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
