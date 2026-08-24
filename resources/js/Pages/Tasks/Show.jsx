import { rewardLines } from "@/constants/rewards";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import PriceFormat from "@/includes/PriceFormat";
import Turnstile from "@/Components/Turnstile";
import Popup from "@/Components/Popup";
import toast from "react-hot-toast";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import PaymentMethodSelector from "@/Components/PaymentMethodSelector";
import { PayButton, OrderContextCard } from "@/Components/Checkout/SummaryReceipt";
import { fieldClass } from "@/Components/Checkout/FormKit";
import ShareButton from "@/Components/ShareButton";
import userphoto from "../../../assets/siteicon.png";
import axios from "axios";
import { feeRatesFor, creatorIdOf, STRIPE_FEE_RATE, STRIPE_FIXED_FEE } from "@/utils/pricing";
import { riskMessageBody, riskMessageTitle } from '@/constants/riskMessages';

export default function Show({ auth, task, share, purchase, purchaseHistory, isCreator, deliverableUrl, currencySymbol, card_capabilities }) {
    const { turnstileSiteKey, platform_fee_percentage, transaction_fee_percentage, flash } = usePage().props;
    const __pageProps = usePage().props;
    const turnstileRef = useRef(null);
    const { data, setData, post, processing } = useForm({
        gifter_message: '',
        agree: false,
        digital_waiver: false,
        cf_turnstile_response: '',
        payment_method: 'card',
    });
    const [previewPrices, setPreviewPrices] = useState(null);
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();

    // Helper to identify zero decimal currencies
    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
            'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
    const calculateTotalSupporterPays = (price, curr, vatAmount = 0) => {
        const listedPrice = parseFloat(price || 0);
        const vat = parseFloat(vatAmount || 0);
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        
        // Client Rule: Add VAT before other fees
        const priceWithVat = listedPrice + vat;

        // Constants must match backend configuration (Helpers.php)
        const stripeFeeRate = STRIPE_FEE_RATE;
        const stripeFixedFee = isZeroDecimal ? 0 : STRIPE_FIXED_FEE;
        // Per-creator: a creator on a bespoke platform rate must be QUOTED
        // what checkout will CHARGE them. The global props cannot express that.
        const __rates = feeRatesFor(creatorIdOf(task), __pageProps);
        const platformFeeRate = __rates.platform / 100;
        const complianceFeeRate = __rates.compliance / 100; 
        const adminFee = adminFeeInCurrency(curr); 
        const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
        
        if (totalDeductionRate >= 1) return priceWithVat;

        const totalSupporterPays = (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
        
        // Rounding logic to match backend (Helpers.php)
        if (!isZeroDecimal) {
            return Math.ceil(totalSupporterPays * 100) / 100;
        } else {
            return Math.ceil(totalSupporterPays);
        }
    };

    const [verified, setVerified] = useState(false);
    const [guestAllowed, setGuestAllowed] = useState(null);
    const onVerify = useCallback((token) => {
        if(token !== null && token !== "" && token !== undefined){
            setData("cf_turnstile_response", token || "");
            setVerified(true);
        }else { 
            setVerified(false);
        }
    }, [setData]);

    useEffect(() => {
        if (auth?.user) {
            setGuestAllowed(true);
            return;
        }
        axios.get("/api/risk/limits")
            .then((res) => {
                const allowed = res?.data?.guest_allowed !== false;
                setGuestAllowed(allowed);
            })
            .catch(() => {
                setGuestAllowed(true);
            });
    }, [auth?.user?.id]);

    const lastFlashRef = useRef({ error: null, success: null, warning: null, info: null });

    // Step-Up Modal State
    const [showStepUp, setShowStepUp] = useState(false);
    const [stepUpData, setStepUpData] = useState(null);
    const [stepUpContext, setStepUpContext] = useState(null);
    const [otpCode, setOtpCode] = useState("");
    const [typedConfirmation, setTypedConfirmation] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    useEffect(() => {
        if (flash?.step_up_required && flash?.step_up_data) {
            setStepUpData(flash.step_up_data);
            setStepUpContext(flash.step_up_context || null);
            setShowStepUp(true);
        }
    }, [flash]);

    // GuestLayout does NOT surface flash messages — without this effect a refused
    // checkout (resolver soft-refusal, validation, risk block) died silently and the
    // buyer just saw the button un-spin. Deduped by ref so a re-render can't re-toast.
    useEffect(() => {
        /*
         * ⚠️ REMOVED — `BrandToaster` now bridges every session flash to a toast
         * once, for the whole app. Toasting it here as well drew each message
         * twice, and two identical toasts dismissing independently reads as a
         * rendering bug rather than as duplicate config.
         */
    }, [flash?.error, flash?.success]);

    
    const [passkeyLoading, setPasskeyLoading] = useState(false);

    // Helper function to encode ArrayBuffer to base64
    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatCredentialForServer = (credential) => {
        const formatted = {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type,
            response: {
                clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
            },
        };

        if (credential.response.authenticatorData) {
            formatted.response.authenticatorData = arrayBufferToBase64(credential.response.authenticatorData);
        }
        if (credential.response.signature) {
            formatted.response.signature = arrayBufferToBase64(credential.response.signature);
        }
        if (credential.response.userHandle) {
            formatted.response.userHandle = arrayBufferToBase64(credential.response.userHandle);
        }
        if (credential.response.attestationObject) {
            formatted.response.attestationObject = arrayBufferToBase64(credential.response.attestationObject);
        }

        return formatted;
    };

    const base64urlToUint8Array = (base64url) => {
        const base64 = base64url
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), "=");

        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    };

    const isWebAuthnSupported = () => {
        return window.PublicKeyCredential !== undefined;
    };

    
    const [hasPasskey, setHasPasskey] = React.useState(false);
    
    React.useEffect(() => {
        const checkPasskey = async () => {
            const userEmail = (typeof email !== 'undefined' ? email : null) || (typeof data !== 'undefined' && data?.email ? data.email : null) || auth?.user?.email;
            if (userEmail && isWebAuthnSupported()) {
                try {
                    const res = await axios.post('/webauthn/check', { email: userEmail });
                    setHasPasskey(res.data.has_passkey);
                } catch (e) {
                    setHasPasskey(false);
                }
            }
        };
        if (typeof showStepUp !== 'undefined' && showStepUp) {
            checkPasskey();
        }
    }, [typeof showStepUp !== 'undefined' ? showStepUp : false]);

    const handlePasskeyStepUp = async () => {
        try {
            setPasskeyLoading(true);
            const userEmail = (typeof email !== 'undefined' ? email : null) || (typeof data !== 'undefined' && data?.email ? data.email : null) || auth?.user?.email;

            if (!userEmail) {
                toast.error("Email required for passkey verification.");
                setPasskeyLoading(false);
                return;
            }

            const { data: options } = await axios.post(
                route("webauthn.login.options"),
                { email: userEmail },
            );

            const publicKey = options.publicKey ?? options;
            publicKey.challenge = base64urlToUint8Array(
                publicKey.challenge,
            );

            if (publicKey.allowCredentials) {
                publicKey.allowCredentials = publicKey.allowCredentials.map(
                    (item) => ({
                        ...item,
                        id: base64urlToUint8Array(item.id),
                    }),
                );
            }

            const credential = await navigator.credentials.get({
                publicKey,
            });

            const payload = {
                ...formatCredentialForServer(credential),
                amount: stepUpContext?.amount || Math.round((parseFloat(String(task.price || 0).replace(/,/g, '')) + parseFloat(String(task.tax_amount || 0).replace(/,/g, ''))) * (task?.creator?.vat_amount_percentage || 0) / 100 * (isZeroDecimalCurrency(task?.currency) ? 1 : 100)),
                currency: stepUpContext?.currency || task?.currency,
                creator_id: stepUpContext?.creator_id || task?.creator?.uuid || task?.creator_id,
                email: stepUpContext?.email || auth?.user?.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            };

            const response = await axios.post('/api/risk/step-up/verify-passkey', payload);
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                if (typeof setSkipCaptcha !== 'undefined') setSkipCaptcha(true);
                handlePurchase();
            } else {
                toast.error("Passkey verification failed.");
            }
        } catch (error) {
            console.error("Passkey error:", error);
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else if (error.name === "NotAllowedError") {
                toast.error("Authentication cancelled.");
            } else {
                toast.error("Unable to authenticate. Please try again.");
            }
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleVerifyStepUp = async (e) => {
        e.preventDefault();
        setVerifyingOtp(true);
        try {
            const finalTotalAmount = calculateTotalSupporterPays(
                task.price, 
                task.currency || 'USD',
                ((parseFloat(String(task.price || 0).replace(/,/g, '')) + parseFloat(String(task.tax_amount || 0).replace(/,/g, ''))) * (task?.creator?.vat_amount_percentage || 0) / 100)
            );
            
            const response = await axios.post('/api/risk/step-up/verify', {
                otp: otpCode,
                typed_confirmation: typedConfirmation,
                amount: Math.round(finalTotalAmount * (isZeroDecimalCurrency(task?.currency) ? 1 : 100)),
                currency: task?.currency,
                creator_id: task?.creator?.uuid || task?.creator_id,
                email: auth?.user?.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            });
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                setVerified(true);
                setData("cf_turnstile_response", "verified");
                handlePurchase();
            } else {
                toast.error("Verification failed.");
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "OTP Verification failedss.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handlePurchase = () => {
        // Re-entrancy guard: a second tap before the disabled re-render must not
        // fire a second checkout session.
        if (processing) return;
        if (!data.agree) {
            toast.error("Please accept the Paid Tasks terms");
            return;
        }
        if (turnstileSiteKey && !verified && !data.cf_turnstile_response) {
            toast.error("Please verify the captcha");
            return;
        }
        if (!auth?.user) {
            const msg = guestAllowed === false
                ? riskMessageBody("GUEST_ACCOUNT_REQUIRED")
                : "Please log in to purchase this task.";
            toast.error(msg);
            window.location = `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`;
            return;
        }
        if (!auth?.user?.email_verified_at) {
            const msg = "Please verify your email to continue.";
            toast.error(msg);
            window.location = route("verification.notice");
            return;
        }

        post(route('task.purchase', task.uuid), {
            preserveScroll: true,
            onError: (errors) => {
                // Surface the refusal — a silent reset left the buyer with no idea
                // why nothing happened.
                const first = errors && Object.values(errors).flat()[0];
                if (first) {
                    toast.error(String(first));
                }
                setData("cf_turnstile_response", "");
                if (turnstileRef.current) {
                    turnstileRef.current.reset();
                }
            },
        });
    };

    return (
        <Guest auth={auth?.user} user={auth?.user}>
            <Head title={task.title} />
            <div className="bg-white px-4 py-4 md:py-8 min-h-dvh">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <Link href={route('task.dashboard')} className="inline-block text-black font-bold uppercase tracking-wide hover:text-[#FF007F] transition-colors">
                            &larr; Back <span className="hidden md:visible"> to Dashboard</span>
                        </Link>

                        {/* Only once it is publicly viewable — sharing a link that
                            404s for everyone but the creator helps nobody. */}
                        {task.is_approved && <ShareButton share={share} />}
                    </div>

                    <div className="">
                        
                        {!task.is_approved && isCreator && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-xl">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm leading-[1.45] font-bold text-yellow-800 uppercase tracking-wide">
                                            In Review
                                        </h3>
                                        <div className="mt-2 text-sm leading-[1.55] text-yellow-700">
                                            <p>
                                                This item is currently in the reviewing process. It will be live within 30min to 1 hr.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {task?.is_suspended == 1 && isCreator && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm leading-[1.45] font-bold text-red-700 uppercase tracking-wide">
                                            Suspended
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p>
                                                <span className="font-semibold">Reason:</span>{" "}
                                                <span className="whitespace-pre-wrap break-words leading-relaxed normal-case">
                                                    {task?.suspend_reason?.trim() || "This task has been suspended by admin."}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content Box */}
                        <div className="bg-white md:border border-gray-200 md:rounded-box md:p-8 mb-8">
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b-2 border-gray-100 pb-6 mb-6">
                                <div className="flex-1 md:pr-6 mb-4 md:mb-0">
                                    <h1 className="text-2xl md:text-3xl font-black uppercase text-black mb-4 leading-tight">
                                        {task.title}
                                    </h1>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`uppercase inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                            task.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                        }`}>{task.status}</span>
                                        <span className="uppercase inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border !bg-blue-100 text-blue-800 !border-blue-200">
                                            {task.type} Delivery
                                        </span>
                                        {task?.sla_hours ? <span className="uppercase inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border !bg-yellow-100 text-yellow-800 !border-yellow-200">
                                            {task.sla_hours === 168 ? '7d' : `${task.sla_hours}h`}
                                        </span> : null}
                                        <span className="uppercase inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border !bg-pink-100 text-pink-800 !border-pink-200">
                                            {task.category || 'Paid Task'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-left md:text-right shrink-0">
                                    <div className="text-2xl md:text-4xl font-black text-[#FF007F] font-anton tracking-wider">
                                        {isCreator ? (
                                            formatMultiPrice(task.price, task.currency || 'USD')
                                        ) : (
                                            formatMultiPrice(
                                                data.payment_method === 'bank' && previewPrices?.bank != null
                                                    ? previewPrices.bank
                                                    : calculateTotalSupporterPays(
                                                        task.price,
                                                        task.currency || 'USD',
                                                        ((parseFloat(String(task.price || 0).replace(/,/g, '')) + parseFloat(String(task.tax_amount || 0).replace(/,/g, ''))) * (task?.creator?.vat_amount_percentage || 0) / 100)
                                                    ),
                                                task.currency || 'USD'
                                            )
                                        )}
                                    </div>
                                    {!isCreator && (
                                        <span className="block text-xs text-black/60 font-medium mt-2 leading-tight">
                                            *Includes platform & payment fees.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="prose prose-lg max-w-none text-black/80 leading-relaxed mb-8 whitespace-pre-wrap">
                                {task.description}
                            </div>

                            {/* Creator Profile Section */}
                            <div className="bg-gray-50 rounded-box-sm p-5 flex items-center justify-between border-2 border-gray-100 mt-6">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={task.creator.avatar_url || userphoto}
                                        alt={task.creator.name}
                                        onError={(e) => { if (e.target.src !== userphoto) e.target.src = userphoto; }}
                                        className="w-14 h-14 rounded-full border-2 border-black object-cover"
                                    />
                                    <div>
                                        <p className="text-xs text-black/60 font-bold uppercase tracking-wider mb-1">Created By</p>
                                        <Link href={`/${task.creator.username}/tasks`} className="group">
                                            <h4 className="text-lg font-black font-anton tracking-wide text-black group-hover:text-[#FF007F] transition-colors leading-none">
                                                {task.creator.name}
                                            </h4>
                                            <p className="text-sm text-black/60 mt-1 font-medium">@{task.creator.username}</p>
                                        </Link>
                                    </div>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-black/60 font-bold uppercase tracking-wider">
                                        Listed On
                                    </p>
                                    <p className="text-sm text-black/60 font-medium mt-1">
                                        {new Date(task.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions / Purchase Form */}
                        <div className="bg-white md:border border-gray-200 md:rounded-box md:p-8 mb-8">
                            {isCreator ? (
                                <div className="text-center py-4">
                                    <p className="mb-4 text-black/60 font-medium">You are the creator of this task.</p>
                                    <a href={route('task.dashboard')} className="button b w-full md:w-auto justify-center">
                                        Manage Orders
                                    </a>
                                </div>
                            ) : (
                                <div>
                                    {/* Instant Delivery Section - Only if access granted */}
                                    {task.type === 'instant' && deliverableUrl && (
                                        <div className="mb-8">
                                            <div className="bg-green-100 text-green-800 px-4 py-3 rounded-box-sm border-2 border-green-300 mb-4 font-bold text-base text-center">
                                                ✓ Purchased Successfully
                                            </div>
                                            <div className="space-y-4">
                                                {task.deliverable_note && (
                                                    <div className="bg-gray-50 border border-gray-200 rounded-box-sm p-4 text-left">
                                                        <h4 className="font-black text-black mb-2 uppercase tracking-wide text-sm">Note from Creator:</h4>
                                                        <p className="whitespace-pre-wrap text-black/80 font-medium text-sm">{task.deliverable_note}</p>
                                                    </div>
                                                )}
                                                <a 
                                                    href={deliverableUrl} 
                                                    className="flex items-center justify-center gap-2 w-full text-center bg-black text-white px-4 py-3 rounded-box-sm hover:bg-gray-800 cursor-pointer font-black uppercase tracking-widest text-sm transition-all"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Download Content 📥
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Purchase Form */}
                                    <div className="">
                                        {!isCreator && (
                                            <OrderContextCard
                                                className="mb-4"
                                                typeBadge={task.type === 'instant' ? 'Paid request · Instant' : 'Paid request · Made for you'}
                                                itemTitle={task.title}
                                                itemSub={task.description}
                                                payingLabel="You're requesting from"
                                                creatorName={task?.creator?.name}
                                                creatorUsername={task?.creator?.username}
                                                creatorAvatar={task?.creator?.avatar_url}
                                                whatYouGet={
                                                    task.type === 'instant'
                                                        ? [
                                                              ...rewardLines(task),
                                                              "The creator's ready-made content, unlocked instantly",
                                                              "A copy sent to your email",
                                                          ]
                                                        : [
                                                              ...rewardLines(task),
                                                              "Custom content the creator makes for your request",
                                                              task.sla_hours ? `Delivered within ${task.sla_hours} hours` : "Delivered within the creator's stated time",
                                                              "Your payment is held safely until it's delivered",
                                                          ]
                                                }
                                            />
                                        )}
                                        {!card_capabilities && (
                                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r" role="alert">
                                                <p className="font-bold">{riskMessageTitle("CREATOR_UNAVAILABLE")}</p>
                                                <p className="text-sm">{riskMessageBody("CREATOR_UNAVAILABLE")}</p>
                                            </div>
                                        )}
                                        <form onSubmit={(e) => e.preventDefault()}>
                                            <div className="mb-4">
                                                <label htmlFor="gifter_message" className="block text-xs font-bold text-black/60 uppercase tracking-wider mb-2">
                                                    Message to Creator (Optional)
                                                </label>
                                                <textarea
                                                    id="gifter_message"
                                                    value={data.gifter_message}
                                                    onChange={e => setData('gifter_message', e.target.value)}
                                                    className={`${fieldClass} min-h-[100px] resize-y`}
                                                    placeholder="Add a personal note with your purchase..."
                                                />
                                            </div>

                                            {turnstileSiteKey ? (
                                                <div className="mb-4 flex justify-start">
                                                    <Turnstile
                                                        ref={turnstileRef}
                                                        size="normal"
                                                        theme="light"
                                                        onVerify={onVerify}
                                                    />
                                                </div>
                                            ) : null}
                                            {(task.payment_methods_accepted ?? 'both') !== 'card' && (
                                                <PaymentMethodSelector
                                                    // Same VAT base as the displayed card total: (price + tax_amount) × vat%.
                                                    // Using price-only here quoted a different bank figure than the card one.
                                                    amount={(parseFloat(String(task.price || 0).replace(/,/g, '')) || 0)
                                                        + ((parseFloat(String(task.price || 0).replace(/,/g, '')) + parseFloat(String(task.tax_amount || 0).replace(/,/g, ''))) * (task?.creator?.vat_amount_percentage || 0) / 100)}
                                                    currency={task.currency || 'USD'}
                                                    email={auth?.user?.email}
                                                    creatorId={creatorIdOf(task)}
                                                    value={data.payment_method}
                                                    onChange={(m) => setData('payment_method', m)}
                                                    onPrices={setPreviewPrices}
                                                    className="mb-4"
                                                />
                                            )}

                                            <CheckoutLegalTerms onAgreeChange={(checked) => {
                                                setData('agree', checked);
                                                setData('digital_waiver', checked);
                                            }} />

                                            <PayButton
                                                label={purchaseHistory && purchaseHistory.length > 0 ? 'Purchase Again 🔄' : (task.type === 'instant' ? 'Pay to Access 🔓' : 'Pay to Assign 📝')}
                                                processing={processing}
                                                disabled={!data.agree || !data.digital_waiver || (turnstileSiteKey && !verified) || !card_capabilities}
                                                onClick={handlePurchase}
                                            />
                                            {!isCreator && (
                                                <p className="text-center text-xs text-black/60 font-normal mt-3 leading-tight">
                                                    You will be charged in {task.currency || 'USD'}.
                                                </p>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Purchase History */}
                        {purchaseHistory && purchaseHistory.length > 0 && (
                            <div className="bg-white md:border border-gray-200 md:rounded-box md:p-8 mb-8">
                                <h3 className="text-xl font-black font-anton uppercase mb-4 text-black">Purchase History</h3>
                                <div className="space-y-4">
                                    {purchaseHistory.map((historyItem) => (
                                        <div key={historyItem.uuid} className="bg-gray-50 border-2 border-gray-200 rounded-box-sm p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-xs uppercase text-black/60 mb-1">
                                                        {new Date(historyItem.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <span className={`uppercase inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                                                        historyItem.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-black border-gray-200'
                                                    }`}>
                                                        {historyItem.status}
                                                    </span>
                                                </div>
                                                <a href={route('task.order', historyItem.uuid)} className="text-sm font-black text-[#FF007F] hover:text-pink-700 uppercase tracking-wide border-b-2 border-pink-200 hover:border-pink-600 transition-colors">
                                                    View Order &rarr;
                                                </a>
                                            </div>
                                            {historyItem.gifter_message && (
                                                <div className="bg-white p-3 rounded-box-sm text-sm italic text-black/60 border border-gray-200">
                                                    "{historyItem.gifter_message}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {!auth?.user && !purchase && (
                            <div className="bg-gray-50 p-4 text-center rounded-box-sm border border-gray-200 mt-6">
                                <p className="text-sm text-black/60 font-bold uppercase tracking-wider">
                                    Please <a href={route('login')} className="text-[#FF007F] hover:text-[#FF007F] hover:underline">login</a> to purchase.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Step-Up Verification Modal */}
            <Popup
                size="md"
                action={showStepUp}
                space="p-0"
                modalclass="pinkmodal"
                classes="hidden"
            >
                <div className="!rounded-none p-6">
                    <h2 className="text-xl font-bold mb-2 text-center">{stepUpData?.ui?.title || 'Confirm Your Payment'}</h2>
                    <p className="text-black/60 mb-6 text-center">
                        {stepUpData?.ui?.body || 'For your security, please confirm this payment.'}
                    </p>
                    <form onSubmit={handleVerifyStepUp}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-black/80 mb-1">Enter OTP Code (Check your email)</label>
                            <input
                                type="text"
                                className={fieldClass}
                                placeholder="e.g. 123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-black/80 mb-1">Type 'CONFIRM' to proceed</label>
                            <input
                                type="text"
                                className={fieldClass}
                                placeholder="CONFIRM"
                                value={typedConfirmation}
                                onChange={(e) => setTypedConfirmation(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowStepUp(false)}
                                className="border-2 border-black w-full main-button !bg-white !text-black !border-black"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={verifyingOtp || !otpCode || typedConfirmation.toUpperCase() !== 'CONFIRM'}
                                className={`w-full main-button p ${(!otpCode || typedConfirmation.toUpperCase() !== 'CONFIRM' || verifyingOtp) ? 'disabled' : ''}`}
                            >
                                {verifyingOtp ? "Verifying..." : "Verify & Checkout"}
                            </button>
                        </div>
                    </form>
                    
                    {isWebAuthnSupported() && hasPasskey && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <button
                                type="button"
                                onClick={handlePasskeyStepUp}
                                disabled={passkeyLoading || (typeof verifyingOtp !== 'undefined' ? verifyingOtp : false)}
                                className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-black/60 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                            >
                                {passkeyLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#FF007F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking device...
                                    </>
                                ) : "Use Face ID / Fingerprint"}
                            </button>
                            <p className="text-xs text-black/60 text-center mt-2">
                                Bypass OTP by verifying your identity with a saved passkey.
                            </p>
                        </div>
                    )}

                </div>
            </Popup>
        </Guest>
    );
}
