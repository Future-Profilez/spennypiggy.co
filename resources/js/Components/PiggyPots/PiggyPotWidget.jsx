import { rewardLines } from "@/constants/rewards";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import axios from 'axios';
import CheckoutLegalTerms from '@/Components/CheckoutLegalTerms';
import PaymentMethodSelector from '@/Components/PaymentMethodSelector';
import Turnstile from '@/Components/Turnstile';
import { OrderContextCard } from '@/Components/Checkout/SummaryReceipt';
import { fieldClass } from '@/Components/Checkout/FormKit';
import confetti from 'canvas-confetti';

// Server-side limits (Helpers::priceWithinLimits, GBP-equivalent) — mirrored here
// so the supporter is told before they reach Stripe, not after.
const MIN_AMOUNT = 4.99;
const MAX_AMOUNT = 500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PiggyPotWidget({ piggyPots, user, global_currency, inPopup, feed }) {
    if (!piggyPots || piggyPots.length === 0) return null;

    const featuredPot = piggyPots.find(p => p.is_pinned) || piggyPots[0];
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectegTag, setselectegTag] = useState(0);
    const [fieldErrors, setFieldErrors] = useState({});
    const [prices, setPrices] = useState(null);

    const { auth, turnstileSiteKey } = usePage().props;
    const { errorAlert } = useAlerts();
    const turnstileRef = useRef(null);
    const [verified, setVerified] = useState(false);

    const { data, setData } = useForm({
        amount: '',
        currency: featuredPot.currency,
        message: '',
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
        anonymous: 0,
        digital_waiver: false,
        agree: false,
        payment_method: 'card',
        cf_turnstile_response: '',
    });

    // Stable identity — the pot widget re-renders on every price-preview poll, and an
    // inline onVerify re-triggered Turnstile's render effect (deps include the callback),
    // remounting the Cloudflare widget dozens of times per session.
    // Declared AFTER useForm: the deps array reads `setData`, which hits a TDZ error
    // if this useCallback sits above the useForm that defines it.
    const onTurnstileVerify = useCallback((token) => {
        setData('cf_turnstile_response', token || '');
        setVerified(!!token);
    }, [setData]);

    // Everything the supporter sees is priced in the POT's currency, because
    // that is the currency the amount is charged in. Converting for display
    // while posting the raw number made the shown price differ from the charge.
    const potCurrency = (featuredPot.currency || global_currency || 'GBP').toUpperCase();
    const fmt = useMemo(() => {
        const formatter = new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: potCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return (v) => formatter.format(Number(v) || 0);
    }, [potCurrency]);

    const targetAmount = parseFloat(featuredPot.target_amount || 0);
    const raisedAmount = parseFloat(featuredPot.total_raised || 0);
    const progressPercent = targetAmount > 0
        ? Math.min(100, (raisedAmount / targetAmount) * 100)
        : 0;
    const remainingAmount = Math.max(0, parseFloat((targetAmount - raisedAmount).toFixed(2)));
    const isComplete = targetAmount > 0 && remainingAmount <= 0;

    const deadlinePassed = featuredPot.deadline
        ? new Date(String(featuredPot.deadline).replace(' ', 'T')) < new Date()
        : false;
    const isHeld = featuredPot.status === 'moderation_hold';
    const isClosed = isComplete || deadlinePassed || isHeld
        || ['archived', 'completed', 'expired'].includes(featuredPot.status);

    const maxAllowed = Math.min(MAX_AMOUNT, remainingAmount > 0 ? remainingAmount : MAX_AMOUNT);
    const presetAmounts = [25, 50, 75];

    const featuredCreatorId = featuredPot.creator_id || featuredPot.creator?.id || featuredPot.user?.id || featuredPot.user_id;
    const isCreator = auth?.user?.id && featuredCreatorId && auth.user.id === featuredCreatorId;
    const shouldCelebrate = !!featuredPot?.is_pinned && isComplete && !inPopup;

    const closedReason = isHeld
        ? 'This content is under review and will be available shortly.'
        : deadlinePassed
            ? 'The creator\'s deadline for this content has passed.'
            : isComplete
                ? 'This content goal has been reached and is now closed.'
                : 'This content is not available right now.';

    const statusLabel = isComplete ? 'Completed' : (featuredPot?.status || 'active');
    // One accent only (DESIGN.md): states are told apart by weight, not by inventing
    // hues. Completed reads as closed (ink), active as live (brand mint).
    const statusBadgeClass = isComplete
        ? 'bg-black text-white'
        : statusLabel === 'active'
            ? 'bg-[#A2E4B8] text-black'
            : statusLabel === 'moderation_hold'
                ? 'bg-black/10 text-black'
                : 'bg-black/10 text-black';

    const [step, setStep] = useState(1); // 1: Amount, 2: Details, 3: Terms & Pay

    const selectPreset = (val) => {
        setAmount(String(val));
        setData('amount', val);
        setselectegTag(val);
        setFieldErrors(e => ({ ...e, amount: null }));
    };

    const handleCustomAmount = (e) => {
        setAmount(e.target.value);
        setData('amount', e.target.value);
        setselectegTag('custom');
        setFieldErrors(err => ({ ...err, amount: null }));
    };

    const validateAmount = () => {
        const n = parseFloat(amount);
        if (!n || Number.isNaN(n)) return 'Enter an amount to continue.';
        if (n < MIN_AMOUNT) return `Minimum purchase is ${fmt(MIN_AMOUNT)}.`;
        if (n > MAX_AMOUNT) return `Maximum purchase is ${fmt(MAX_AMOUNT)}.`;
        if (remainingAmount > 0 && n > remainingAmount) {
            return `Only ${fmt(remainingAmount)} left before this goal is reached.`;
        }
        return null;
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (isClosed) {
                setFieldErrors({ amount: closedReason });
                return;
            }
            const err = validateAmount();
            if (err) {
                setFieldErrors({ amount: err });
                return;
            }
            setFieldErrors({});
            setStep(2);
        } else if (step === 2) {
            if (!auth?.user) {
                const errs = {};
                if (!data.name?.trim()) errs.name = 'Enter a display name.';
                if (!EMAIL_RE.test(String(data.email || '').trim())) {
                    errs.email = 'Enter a valid email — your content and receipt are sent here.';
                }
                if (Object.keys(errs).length) {
                    setFieldErrors(errs);
                    return;
                }
            }
            setFieldErrors({});
            setStep(3);
        }
    };

    const handleContribute = async () => {
        if (loading) return;

        const err = validateAmount();
        if (err) {
            setStep(1);
            setFieldErrors({ amount: err });
            return;
        }

        if (!data.digital_waiver) {
            setFieldErrors({ waiver: 'Please accept the terms to continue.' });
            return;
        }

        if (turnstileSiteKey && !verified && !data.cf_turnstile_response) {
            errorAlert('Please complete the security check.');
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post(route('piggy-pot.pay', featuredPot.uuid), data);

            if (res.data.status) {
                window.location.href = res.data.url;
                return;
            }

            if (res.data.card_verification_required) {
                errorAlert(res.data.msg);
            } else if (res.data.step_up) {
                errorAlert('Verification required. Please contact support.');
            } else {
                errorAlert(res.data.msg || 'Failed to start payment. Please try again.');
            }
            setLoading(false);
        } catch (error) {
            const bag = error?.response?.data?.errors;
            const first = bag && Object.values(bag).flat()[0];
            errorAlert(first || error?.response?.data?.message || 'Something went wrong. Your card has not been charged.');
            setVerified(false);
            setData('cf_turnstile_response', '');
            if (turnstileRef.current) {
                turnstileRef.current.reset();
            }
            setLoading(false);
        }
    };

    // What the supporter is actually charged (listed price grossed up by fees).
    // Fetched here so the total is shown even when the bank selector is hidden.
    useEffect(() => {
        if (step !== 3 || !data.amount) {
            return;
        }
        let cancelled = false;
        const t = setTimeout(() => {
            axios.post('/payments/price-preview', {
                amount: Number(data.amount),
                currency: potCurrency,
            })
                .then(res => { if (!cancelled && res.data?.status) setPrices(res.data.prices); })
                .catch(() => { if (!cancelled) setPrices(null); });
        }, 250);

        return () => { cancelled = true; clearTimeout(t); };
    }, [step, data.amount, potCurrency]);

    const totalCharged = prices
        ? (data.payment_method === 'bank' ? prices.bank : prices.card)
        : null;

    useEffect(() => {
        if (!shouldCelebrate) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
        try {
            const key = `pp_celebrated_${featuredPot.uuid}`;
            if (sessionStorage.getItem(key) === '1') return;
            sessionStorage.setItem(key, '1');
            setTimeout(() => {
                confetti({
                    particleCount: 120,
                    spread: 90,
                    origin: { y: 0.35 },
                    colors: ["#FF007F", "#A2E4B8", "#FFFFFF"]
                });
            }, 350);
        } catch (e) {}
    }, [shouldCelebrate, featuredPot?.uuid]);

    const primaryBtn = 'w-full min-h-[52px] py-3 rounded-box-sm border-[3px] border-black font-black text-base uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all';
    const primaryOn = 'bg-[#FF007F] text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none';
    const primaryOff = 'bg-pink-200 text-pink-900 cursor-not-allowed';
    // The one checkout field recipe. This widget used to carry its own (3px border,
    // 52px, focus:ring-0, Tailwind pink-500 instead of the brand pink) — a fifth
    // form vocabulary on the payment surfaces.
    const fieldBase = fieldClass;
    const labelBase = 'block font-black text-[11px] uppercase tracking-widest text-black/70 mb-1.5';

    const FieldError = ({ name }) => fieldErrors[name] ? (
        <p role="alert" className="text-xs font-bold text-red-600 mt-1 px-1">{fieldErrors[name]}</p>
    ) : null;

    return (
        <div className="w-full flex mb-2 relative z-10">
            <div className={`w-full ${inPopup ? '' : 'bg-white rounded-box border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6 lg:p-8'}`}>
                {/* Row layout: cover left, everything else right (stacks on small phones) */}
                <div className="md:flex md:items-start md:gap-6">
                    <div className="w-full relative md:w-[280px] lg:w-[320px] md:shrink-0">
                        <div className="absolute -top-3 -left-3 bg-[#A2E4B8] text-black px-4 py-1.5 rounded-full border-[3px] border-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10 flex items-center gap-1 uppercase tracking-wide">
                            🎯 CONTENT GOAL
                        </div>
                        <div className="w-full h-40 sm:h-48 md:h-56 bg-[#16161C] rounded-box-sm border-[3px] border-black overflow-hidden relative shadow-[inset_0px_0px_20px_rgba(0,0,0,0.5)]">
                            <img
                                src={featuredPot.cover_media || 'https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/'}
                                alt={featuredPot.title ? `Cover art for ${featuredPot.title}` : 'Content cover'}
                                className="w-full h-full object-cover opacity-90"
                            />
                        </div>
                    </div>

                    <div className="w-full min-w-0 md:flex-1 flex flex-col justify-center">
                        <h2 className="font-anton text-2xl md:text-3xl mt-3 md:mt-0 uppercase text-black tracking-wide">{featuredPot.title}</h2>
                        {featuredPot.description && (
                            <p className="text-sm md:text-base text-black/60 mb-3 line-clamp-3">{featuredPot.description}</p>
                        )}

                        {/* The deliverable — what the supporter actually receives. */}
                        {(featuredPot.content_description || featuredPot.content_file) && (
                            <div className="mb-4 rounded-box-sm border-[3px] border-black bg-[#A2E4B8] px-4 py-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-xs uppercase tracking-widest text-black">What you unlock</p>
                                <p className="font-bold text-sm text-black mt-1">
                                    {featuredPot.content_description || 'Exclusive content, delivered instantly after purchase.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress + purchase area — full width under the row */}
                <div className="w-full mt-4">
                        <div className="flex justify-between items-end mb-2">
                            <div className="font-bold text-black/60 text-xs md:text-sm uppercase tracking-widest">Target: {fmt(targetAmount)}</div>
                            <div className="font-black text-[#FF007F] text-sm md:text-lg uppercase tracking-widest">Progress: {fmt(raisedAmount)}</div>
                        </div>
                        <div className="flex justify-between items-center mb-2 gap-3">
                            <div className="font-bold text-black/60 text-xs md:text-sm uppercase tracking-widest">
                                Remaining: {fmt(remainingAmount)}
                            </div>
                            <div className={`font-black text-xs md:text-sm uppercase tracking-widest px-3 py-1 rounded-full border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusBadgeClass}`}>
                                {isComplete ? '✓ COMPLETED' : statusLabel}
                            </div>
                        </div>

                        <div
                            className="w-full bg-white h-4 md:h-5 rounded-full border-[3px] border-black overflow-hidden mb-6 shadow-[inset_0_2px_0_rgba(0,0,0,0.1)]"
                            role="progressbar"
                            aria-valuenow={Math.round(progressPercent)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Content goal progress"
                        >
                            <div
                                className={`${isComplete ? 'bg-[#A2E4B8]' : 'bg-[#FF007F]'} h-full transition-all duration-1000 ease-out`}
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>

                        {!isCreator && !isClosed && (
                            <p className="text-[11px] font-black uppercase tracking-widest text-black/60 mb-2">
                                Step {step} of 3 · {step === 1 ? 'Choose amount' : step === 2 ? 'Your details' : 'Payment'}
                            </p>
                        )}

                        {step === 1 && (
                            isCreator ? (
                                <div className="animate-fade-in space-y-4 rounded-box border-[3px] border-black p-6 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-black/80 text-base font-bold">
                                        You are the creator of this content. Creators cannot purchase their own content.
                                    </p>
                                    <Link
                                        href={route('piggy-pots.index')}
                                        className="inline-flex w-full min-h-[48px] items-center justify-center py-3 rounded-box-sm border-[3px] border-black bg-[#A2E4B8] text-black font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#A2E4B8]"
                                    >
                                        Edit Piggy Pot
                                    </Link>
                                </div>
                            ) : isClosed ? (
                                <div className="animate-fade-in rounded-box border-[3px] border-black p-6 bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="font-black text-sm uppercase tracking-widest text-black">Not available</p>
                                    <p className="text-black/60 text-sm font-bold mt-1">{closedReason}</p>
                                    {(featuredPot.creator?.username || user?.username) && (
                                        <Link
                                            href={route('user.show', { username: featuredPot.creator?.username || user?.username })}
                                            className="mt-4 inline-flex w-full min-h-[48px] items-center justify-center py-3 rounded-box-sm border-[3px] border-black bg-white text-black font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50"
                                        >
                                            See other content
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                                        {presetAmounts.map(val => {
                                            const disabled = val > maxAllowed;
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => selectPreset(val)}
                                                    disabled={disabled}
                                                    aria-pressed={selectegTag === val}
                                                    className={`flex-1 min-w-[72px] min-h-[48px] py-2 rounded-box-sm border-[3px] border-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${disabled ? 'bg-gray-200 text-black/60 cursor-not-allowed' : (selectegTag === val ? 'bg-[#A2E4B8] active:translate-y-1 active:translate-x-1 active:shadow-none' : 'bg-white hover:bg-gray-50 active:translate-y-1 active:translate-x-1 active:shadow-none')}`}
                                                >
                                                    {fmt(val)}
                                                </button>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setselectegTag('custom');
                                                setAmount('');
                                                setData('amount', '');
                                            }}
                                            aria-pressed={selectegTag === 'custom'}
                                            className={`px-4 min-h-[48px] rounded-box-sm border-[3px] border-black font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all ${selectegTag === 'custom' ? 'bg-[#A2E4B8]' : 'bg-white hover:bg-gray-50'}`}
                                        >
                                            CUSTOM
                                        </button>
                                    </div>

                                    {selectegTag === 'custom' && (
                                        <div className="mb-4 animate-fade-in">
                                            <label htmlFor="pp-amount" className={labelBase}>
                                                Amount ({potCurrency})
                                            </label>
                                            <input
                                                id="pp-amount"
                                                className={`${fieldBase} text-lg ${fieldErrors.amount ? 'border-red-600' : ''}`}
                                                value={amount}
                                                onChange={handleCustomAmount}
                                                type="number"
                                                inputMode="decimal"
                                                min={MIN_AMOUNT}
                                                max={maxAllowed}
                                                step="0.01"
                                                aria-describedby="pp-amount-help"
                                                placeholder={`${MIN_AMOUNT}`}
                                            />
                                            <p id="pp-amount-help" className="text-xs font-bold text-black/60 mt-1 px-1">
                                                {fmt(MIN_AMOUNT)} – {fmt(maxAllowed)}
                                            </p>
                                        </div>
                                    )}

                                    <FieldError name="amount" />

                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        disabled={!amount}
                                        className={`${primaryBtn} mt-2 ${!amount ? primaryOff : primaryOn}`}
                                    >
                                        Unlock Content
                                    </button>
                                </div>
                            )
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-3 animate-fade-in">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-black text-sm uppercase">Your Details</h4>
                                    <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-black/60 hover:text-black underline py-2 px-1">Back to amount</button>
                                </div>

                                <div>
                                    <label htmlFor="pp-message" className={labelBase}>Note to the creator (optional)</label>
                                    <textarea
                                        id="pp-message"
                                        className={`${fieldBase} min-h-[88px]`}
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Say something to the creator."
                                    />
                                </div>

                                {!auth?.user && (
                                    <>
                                        <div>
                                            <label htmlFor="pp-name" className={labelBase}>Display name</label>
                                            <input
                                                id="pp-name"
                                                className={`${fieldBase} ${fieldErrors.name ? 'border-red-600' : ''}`}
                                                value={data.name}
                                                onChange={(e) => { setData('name', e.target.value); setFieldErrors(err => ({ ...err, name: null })); }}
                                                type="text"
                                                autoComplete="nickname"
                                                placeholder="How the creator sees you"
                                            />
                                            <FieldError name="name" />
                                        </div>
                                        <div>
                                            <label htmlFor="pp-email" className={labelBase}>Email</label>
                                            <input
                                                id="pp-email"
                                                className={`${fieldBase} ${fieldErrors.email ? 'border-red-600' : ''}`}
                                                value={data.email}
                                                onChange={(e) => { setData('email', e.target.value); setFieldErrors(err => ({ ...err, email: null })); }}
                                                type="email"
                                                autoComplete="email"
                                                inputMode="email"
                                                aria-describedby="pp-email-help"
                                                placeholder="you@example.com"
                                            />
                                            <FieldError name="email" />
                                            <p id="pp-email-help" className="text-xs text-black/60 mt-1 font-bold px-1">
                                                Your content and receipt are sent here. Never shown to the creator.
                                            </p>
                                        </div>
                                    </>
                                )}

                                {featuredPot.allow_anonymous && (
                                    <label className="flex items-center cursor-pointer gap-3 px-1 py-2 min-h-[44px]">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={!!data.anonymous}
                                                onChange={(e) => setData('anonymous', e.target.checked ? 1 : 0)}
                                            />
                                            <div className={`block w-11 h-7 rounded-full border-[3px] border-black transition-colors ${data.anonymous ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
                                            <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full border-[3px] border-black transition-transform ${data.anonymous ? 'transform translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="font-bold text-sm">Hide my name from the public list</span>
                                    </label>
                                )}

                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className={`${primaryBtn} mt-2 ${primaryOn}`}
                                >
                                    Continue
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col animate-fade-in">
                                <div className="flex justify-between items-center pb-3">
                                    <h4 className="font-black text-lg uppercase">Final Step</h4>
                                    <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-black/60 hover:text-black underline py-2 px-1">Back</button>
                                </div>

                                <OrderContextCard
                                    className="mb-3"
                                    image={featuredPot.cover_media}
                                    typeBadge="Piggy Pot"
                                    itemTitle={featuredPot.title}
                                    itemSub={featuredPot.content_description || featuredPot.description}
                                    payingLabel="You're unlocking from"
                                    creatorName={user?.name}
                                    creatorUsername={user?.username}
                                    creatorAvatar={user?.avatar_url}
                                    whatYouGet={[
                                        ...rewardLines(featuredPot),
                                        "Access to this pot's content after payment",
                                        "Your purchase counts toward the creator's goal",
                                        "A one-time payment — nothing recurring",
                                    ]}
                                />

                                <div className="rounded-box-sm border-[3px] border-black bg-gray-50 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-3">
                                    <div className="flex justify-between items-center font-bold text-sm text-black/60">
                                        <span>Creator receives</span>
                                        <span>{fmt(data.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-black text-lg mt-2 pt-2 border-t-[3px] border-black">
                                        <span>You pay</span>
                                        <span className="text-[#FF007F]">
                                            {totalCharged != null ? fmt(totalCharged) : 'Calculating…'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-black/60 mt-2">
                                        Includes payment processing and platform fees.
                                    </p>
                                </div>

                                <PaymentMethodSelector
                                    amount={parseFloat(data.amount) || 0}
                                    currency={potCurrency}
                                    email={data.email || auth?.user?.email}
                                    value={data.payment_method}
                                    onChange={(m) => setData('payment_method', m)}
                                    onPrices={setPrices}
                                    className="mb-2"
                                />

                                <CheckoutLegalTerms onAgreeChange={(checked) => {
                                    setData('agree', checked);
                                    setData('digital_waiver', checked);
                                    setFieldErrors(err => ({ ...err, waiver: null }));
                                }} />

                                <FieldError name="waiver" />

                                {turnstileSiteKey ? (
                                    <div className="flex justify-center my-3">
                                        <Turnstile
                                            ref={turnstileRef}
                                            size="normal"
                                            theme="light"
                                            onVerify={onTurnstileVerify}
                                        />
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={handleContribute}
                                    // totalCharged == null means the price preview failed or is still
                                    // loading — never let the buyer pay without seeing the amount.
                                    disabled={loading || !data.digital_waiver || totalCharged == null || (turnstileSiteKey && !verified)}
                                    aria-busy={loading}
                                    className={`${primaryBtn} ${(!data.digital_waiver || loading || totalCharged == null || (turnstileSiteKey && !verified)) ? primaryOff : primaryOn}`}
                                >
                                    {loading ? 'Processing…' : totalCharged == null ? 'Calculating…' : 'Unlock content'}
                                </button>
                                <div className="mt-2 text-center text-xs font-bold text-black/60">
                                    🔒 Secured via Stripe
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
