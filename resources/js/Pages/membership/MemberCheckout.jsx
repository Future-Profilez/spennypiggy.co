import React from 'react';
import { useCallback, useEffect, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import toast, { Toaster } from "react-hot-toast";
import Membership from "./Membership";
import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Turnstile from "@/Components/Turnstile";
import Social from "../Auth/Social";
import Popup from "@/Components/Popup";
import axios from "axios";

export default function SubCheckout(props) {
    const { flash, rates, platform_fee_percentage, transaction_fee_percentage, turnstileSiteKey } = usePage().props;
    const turnstileRef = useRef(null);
    const { user, auth, membership, vat_amount, isSocilAdded, card_capabilities, creator_currency, display_currency } = props;
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const [username, setUserName] = useState(
        (auth && auth.user && auth.user.username) || ""
    );
    const [name, setName] = useState(
        (auth && auth.user && auth.user.name) || ""
    );
    const [email, setEmail] = useState(
        (auth && auth.user && auth.user.email) || ""
    );
    const { successAlert, errorAlert, warningAlert, infoAlert } = useAlerts();
    const { data, setData, post, processing, errors } = useForm({
        name: name,
        email: email,
        message: "",
        agree: false,
        digital_waiver: false,
        anonymous: 0,
        cf_turnstile_response: "",
    });

    // Helper to identify zero decimal currencies
    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
            'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
    const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
        const listedPrice = parseFloat(String(price || 0).replace(/,/g, ''));
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        const vatAmount = listedPrice * (parseFloat(vatPercent) || 0) / 100;
        const priceWithVat = listedPrice + vatAmount;

        // Constants must match backend configuration (Helpers.php)
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
        const platformFeeRate = (platform_fee_percentage || 20) / 100; 
        const complianceFeeRate = (transaction_fee_percentage || 2) / 100; 
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

    const finalTotalAmount = calculateTotalSupporterPays(
        membership?.price, 
        membership?.currency,
        membership?.user?.vat_amount_percentage || 0
    );

    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    function checkanonymous(e) {
        setKeepAnonmyous(e.target.checked);
        if (e.target.checked) {
            setData("anonymous", 1);
        } else {
            setData("anonymous", 0);
        }
    }

    const [checking, setChecking] = useState(false);
    const [verified, setVerified] = useState(false);
    const handleSubmit = (e) => {
        e && e.preventDefault();
        if (turnstileSiteKey && !verified && !data.cf_turnstile_response) {
            toast.error("Please complete the CAPTCHA verification.");
            return false;
        }
        setChecking(true);
        post(
            route(`membership.checkout`, {
                uuid: membership?.uuid || null,
                reccure:
                    membership?.level == "lifetime" ? "onetime" : "continue",
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setChecking(false);
                },
                onError: () => {
                    setChecking(false);
                    setVerified(false);
                    setData("cf_turnstile_response", "");
                    if (turnstileRef.current) {
                        turnstileRef.current.reset();
                    }
                },
            }
        );
    };
    

    const onVerify = useCallback((token) => {
        setData("cf_turnstile_response", token || "");
        setVerified(!!token);
    }, [setData, setVerified]);

    // const executeCaptcha = (e) => {

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
            setChecking(false);
        }
    }, [flash]);

    
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
                amount: stepUpContext?.amount || Math.round(finalTotalAmount * (isZeroDecimalCurrency(membership?.currency) ? 1 : 100)),
                currency: stepUpContext?.currency || membership?.currency,
                creator_id: stepUpContext?.creator_id || membership?.user?.uuid || membership?.user?.id,
                email: stepUpContext?.email || data.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            };

            const response = await axios.post('/api/risk/step-up/verify-passkey', payload);
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                if (typeof setSkipCaptcha !== 'undefined') setSkipCaptcha(true);
                handleSubmit();
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
            const response = await axios.post('/api/risk/step-up/verify', {
                otp: otpCode,
                typed_confirmation: typedConfirmation,
                amount: Math.round(finalTotalAmount * (isZeroDecimalCurrency(membership?.currency) ? 1 : 100)),
                currency: membership?.currency,
                creator_id: membership?.user?.uuid || membership?.user?.id,
                email: data.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            });
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                setVerified(true);
                setData("cf_turnstile_response", "verified");
                handleSubmit();
            } else {
                toast.error("Verification failed.");
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "OTP Verification failed.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    useEffect(() => {
        if (flash?.error) {
            errorAlert(flash.error);
        }
        if (flash?.success) {
            successAlert(flash.success);
        }
        if (flash?.warning) {
            warningAlert(flash.warning);
        }
        if (flash?.info) {
            infoAlert(flash.info);
        }
    }, [flash]);

    const [socialLinks, setSocialLinks] = useState([]);
    const [sLinks, setLinks] = useState([]);
    const fetchingLinks = () => {
        axios
            .get(`/sociallinks/${username}`)
            .then((resp) => {
                setSocialLinks(resp.data.sociallinks);
                setLinks(resp.data.slinks);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    useEffect(() => {
        fetchingLinks();
    }, []);

    return (
        <>
            <Authenticated auth={auth.user} user={user}>
                <Head title={`Join - ${membership?.level} membership`} />
                <div className={`bg-white py-12 px-0  lg:px-2`}>
                    <div className="containerbox mx-auto">
                        <div className="cartMain max-w-[800px] mx-auto">
                            <div className="md:flex w-full gap-10 mb-10">
                                <div className="w-full md:max-w-[40%]">
                                    <Membership hidebtn={true} item={membership} />
                                </div>
                                <div className="pt-6">
                                    <h2 className="pb-1 text-3xl font-bold">
                                        Membership Basket for{" "}
                                        {membership?.user?.name || " "}
                                        <Link
                                            className="text-violet-600"
                                            target="_blank"
                                            href={`/${
                                                membership?.user?.username || ""
                                            }`}
                                        >
                                            @{membership?.user?.username || ""}
                                        </Link>
                                    </h2>
                                    <p className="pb-4 mt-3">
                                        You are about to join {membership?.level}{" "}
                                        membership.
                                    </p>
                                    <div className="w-full lg:max-w-[300px] cartTotal px-0 lg:pt-4 flex justify-end">
                                        <ul className="w-full">
                                            <li className="flex justify-between mb-3">
                                                <span className="min-w-[100px] text-xl block">Total:</span>
                                                <div className="text-right">
                                                    <strong className="block text-xl">
                                                        {formatMultiPrice(finalTotalAmount, membership?.currency)}
                                                    </strong>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>

                                    {display_currency && display_currency !== membership?.currency && (
                                        <div className="text-normal text-gray-500 font-medium mt-1">
                                            ≈ {formatMultiPrice(finalTotalAmount, display_currency)} (estimated)
                                        </div>
                                    )}

                                    <span className="text-normal text-gray-500 font-normal mt-1 leading-tight block">
                                        * Includes all fees. You will be charged in {membership?.currency}.
                                    </span>
                                    
                                </div>
                                
                            </div>
                            <div className="addMessage mt-5">
                                <ul className="flex flex-wrap">
                                    <li className="w-full">
                                        <label className=" mb-2 text-sm font-medium text-gray-900">Add Message </label>
                                        <textarea
                                            className="border-gray-300 border rounded-[30px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                                            onKeyUp={(e) => setData("message",e.target.value)}
                                            placeholder="Write message in under 800 Words..."
                                            defaultValue={data.message}
                                        ></textarea> 
                                        <span className="text-xs text-red-600"> {errors.message}</span>
                                    </li>


                                    <li className="w-full mt-3">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="w-full mb-4">
                                                <label className=" text-left ">
                                                    Email{" "}
                                                </label>
                                                
                                                <input
                                                    className={`${auth && auth?.user && auth?.user?.email ? "disabled":""} mt-2 border-gray-300 border rounded-[20px] p-4 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                    value={data.email}
                                                    disabled={
                                                        auth &&
                                                        auth?.user &&
                                                        auth?.user?.email
                                                            ? true
                                                            : false
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "email",
                                                            e.target.value
                                                        )
                                                    }
                                                    type="email"
                                                    placeholder="Enter Your Email..."
                                                />
                                                <span className=" text-xs text-red-600">
                                                    {errors.email}
                                                </span>
                                                <p className="mt-2 text-sm text-gray-500 mb-1">
                                                    Your e-mail remains
                                                    private.
                                                </p>
                                            </div>
                                            <div className="w-full mb-4">
                                                <label className=" text-left">
                                                    From
                                                </label>
                                                <input
                                                    className="mt-2 border-gray-300 border !rounded-[20px] p-4 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 "
                                                    onChange={(e) =>
                                                        setData(
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    value={data.name}
                                                    type="text"
                                                    placeholder="Enter Your Name..."
                                                />
                                                <span className="text-xs text-red-600">
                                                    {errors?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="cheklistbox mt-6">
                                        <label
                                            htmlFor="anonymous"
                                            className="text-left"
                                        >
                                            <input
                                                onChange={checkanonymous}
                                                type="checkbox"
                                                id="anonymous"
                                                name="anonymous"
                                                className="mr-2"
                                                value="anonymous"
                                            ></input>
                                            Keep anonymous
                                        </label>
                                        <p className="text-gray-500 text-sm mb-6">
                                            Your personal email and name
                                            will be private.
                                        </p>
                                        <label
                                            htmlFor="agreeterm"
                                            className="text-left  "
                                        >
                                            <input
                                                onChange={(e) =>
                                                    setData(
                                                        "agree",
                                                        e.target.checked
                                                    )
                                                }
                                                type="checkbox"
                                                id="agreeterm"
                                                name="agreeterm"
                                                className="mr-2"
                                                value="agreeterm"
                                            ></input>
                                            I understand I am paying the
                                            creator directly and I agree to
                                            the{" "}
                                            <Link
                                                target="_blank"
                                                className="text-violet-600"
                                                href={route(
                                                    "terms-and-conditions"
                                                )}
                                            >
                                                Terms of Service
                                            </Link>{" "}
                                            and{" "}
                                            <Link
                                                className="text-violet-600"
                                                target="_blank"
                                                href={route("terms-and-conditions")}
                                            >
                                                {" "}
                                                Privacy Policy{" "}
                                            </Link>{" "}
                                            and the following statements:
                                        </label>
                                        <div className="tearmlist pl-3">
                                            <ul className="pl-0">
                                                <li>
                                                    {" "}
                                                    This payment will be
                                                    automatically taken on a
                                                    daily,weekly,monthly or
                                                    yearly basis depending
                                                    on your choice and can be
                                                    cancelled anytime.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    For Memberships and
                                                    subscriptions, I
                                                    understand I am making a
                                                    non-refundable purchase
                                                    that provides access to
                                                    exclusive posts. This
                                                    payment will be
                                                    automatically taken on a
                                                    daily, weekly, monthly
                                                    or yearly basis
                                                    depending on the
                                                    subscription type. Can
                                                    be cancelled anytime.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I understand that for
                                                    wishes or support
                                                    payments I am making a
                                                    non-refundable donation
                                                    of support and
                                                    understand I will
                                                    recieve a thank you
                                                    message as a reward.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    This payment of purchase
                                                    or donation is intended
                                                    soley for the wish
                                                    recipient{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I have taken the
                                                    necessary steps to
                                                    confirm the account
                                                    owner is authentic and I
                                                    understand that Spenny
                                                    Piggy will not be held
                                                    responsible for any
                                                    issues arising from a
                                                    catfishing situation.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I understand that by
                                                    violating these terms I
                                                    may be subject to legal
                                                    action or can fall a
                                                    victim of scams.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I understand that by
                                                    checking the box above
                                                    and then clicking
                                                    "CHECKOUT",I will have
                                                    created a legally
                                                    binding e-signature to
                                                    this agreement.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    By providing an
                                                    e-mail,you confirm that
                                                    you are happy to receive
                                                    marketing updates. You
                                                    can opt out at anytime.{" "}
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                                <div className="mt-6 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-[15px]">
                                    <label
                                        htmlFor="digital_waiver"
                                        className="text-left flex items-start cursor-pointer group"
                                    >
                                        <div className="flex items-center h-5 mt-1">
                                            <input
                                                onChange={(e) => setData('digital_waiver', e.target.checked)}
                                                type="checkbox"
                                                id="digital_waiver"
                                                name="digital_waiver"
                                                className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 transition-all cursor-pointer"
                                                checked={data.digital_waiver}
                                                required
                                            />
                                        </div>
                                        <span className="ml-3 text-sm text-gray-700 font-medium leading-relaxed group-hover:text-black transition-colors">
                                            I request that my content is made available immediately. I understand that by proceeding I lose my 14-day right to cancel.
                                        </span>
                                    </label>
                                    {errors.digital_waiver && (
                                        <p className="mt-2 text-xs text-red-600 font-bold uppercase tracking-tight">
                                            {errors.digital_waiver}
                                        </p>
                                    )}
                                </div>
                                {!card_capabilities && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-3" role="alert">
                                        <strong className="font-bold">Payment Unavailable: </strong>
                                        <span className="block sm:inline">This creator cannot receive payments yet.</span>
                                    </div>
                                )}
                                {turnstileSiteKey ? (
                                    <div className="flex justify-center my-3">
                                        <Turnstile
                                            ref={turnstileRef}
                                            size="normal"
                                            theme="light"
                                            onVerify={onVerify}
                                        />
                                    </div>
                                    ) : null}
                                <div className="mt-4 flex items-center justify-center">
                                    <button
                                        onClick={handleSubmit}
                                        className={`${
                                            !data.agree ||
                                            !data.digital_waiver ||
                                            processing ||
                                            checking ||
                                            !card_capabilities
                                                ? "disabled"
                                                : ""
                                        } button-pink btn-shadow shadow-black text-white md !px-8 mt-3 text-center`}
                                        disabled={
                                            !data.agree ||
                                            !data.digital_waiver ||
                                            processing ||
                                            checking ||
                                            !card_capabilities
                                        }
                                    >
                                        {processing || checking
                                            ? "Processing..."
                                            : `${membership?.level == "lifetime" ? "Join Now for" : "Subscribe Now for"} ${formatMultiPrice(
                                                finalTotalAmount,
                                                membership && membership?.currency
                                            )}`}
                                    </button>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Social
                    openSocial={isSocilAdded ? "no" : "open"}
                    removetext={true}
                    type="membership"
                    redirect_url={`/membership/checkout/${membership?.uuid}${
                        membership?.level == "lifetime" ? "/onetime" : ""
                    }`}
                    updatedLinks={fetchingLinks}
                    links={sLinks}
                />
                
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
                        <p className="text-gray-600 mb-6 text-center">
                            {stepUpData?.ui?.body || 'For your security, please confirm this payment.'}
                        </p>
                        <form onSubmit={handleVerifyStepUp}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP Code (Check your email)</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                    placeholder="e.g. 123456"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type 'CONFIRM' to proceed</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
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
                                    className="w-full main-button b"
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
                                className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                            >
                                {passkeyLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking device...
                                    </>
                                ) : "Use Face ID / Fingerprint"}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Bypass OTP by verifying your identity with a saved passkey.
                            </p>
                        </div>
                    )}

                    </div>
                </Popup>

                <Toaster />
            </Authenticated>
        </>
    );
}
