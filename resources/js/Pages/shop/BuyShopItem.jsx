import React from 'react';
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import Popup from "@/Components/Popup";
import { Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import userdefaultphoto from "../../../assets/img/userphoto.png";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import toast from "react-hot-toast";
import PriceFormat from "@/includes/PriceFormat";
import { useEffect } from "react";
import { useRef } from "react";
import AllContries from "../../includes/AllCountries";
import Turnstile from "@/Components/Turnstile";

export default function BuyShopItem({
    opened,
    classes,
    text,
    s,
    open,
    isPaid,
    selectedVarient,
    country,
    shippingPrice,
    card_capabilities,
}) {
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const { auth, turnstileSiteKey, shop, platform_fee_percentage, transaction_fee_percentage } = usePage().props;
    const turnstileRef = useRef(null);
    const [close, setClose] = useState();

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
        const platformFeeRate = (platform_fee_percentage || 17) / 100; 
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

    useEffect(() => {
        if (open) {
            setClose(true);
        }
    }, [open]);

    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const actualPrice = () => {
        if (s && s.is_member == 1 && s.special_member_price) {
            return s.special_member_price;
        } else {
            return s.price;
        }
    };

    const [shipping_info, setshipping_info] = useState({
        country: "",
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
    });
    const handleShipInput = (e) => {
        setshipping_info({
            ...shipping_info,
            [e.target.name]: e.target.value,
        });
    };

    const [fairPrice, setfaiPrice] = useState(actualPrice());

    useEffect(() => {
        setfaiPrice(actualPrice());
    }, [s]);

    const slug = (inputString) => {
        return inputString
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const [email, setEmail] = useState((auth && auth.user?.email) || "");
    const [name, setName] = useState((auth && auth.user?.name) || "");
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [digitalWaiver, setDigitalWaiver] = useState(false);

    const [checking, setChecking] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");

    // Step-Up Modal State
    const [showStepUp, setShowStepUp] = useState(false);
    const [stepUpData, setStepUpData] = useState(null);
    const [stepUpContext, setStepUpContext] = useState(null);
    const [otpCode, setOtpCode] = useState("");
    const [typedConfirmation, setTypedConfirmation] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    const onVerify = React.useCallback((token) => {
        setCaptchaToken(token || "");
    }, []);

    
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
            const userEmail = email || auth?.user?.email;
            if (userEmail && isWebAuthnSupported()) {
                try {
                    const res = await axios.post('/webauthn/check', { email: userEmail });
                    setHasPasskey(res.data.has_passkey);
                } catch (e) {
                    setHasPasskey(false);
                }
            }
        };
        if (showStepUp) {
            checkPasskey();
        }
    }, [showStepUp]);

    const handlePasskeyStepUp = async () => {
        try {
            setPasskeyLoading(true);
            const userEmail = email || auth?.user?.email;

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
                amount: stepUpContext?.amount,
                currency: stepUpContext?.currency,
                creator_id: stepUpContext?.creator_id,
                email: stepUpContext?.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            };

            const response = await axios.post('/api/risk/step-up/verify-passkey', payload);
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                buyItem("verified");
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
                amount: stepUpContext?.amount,
                currency: stepUpContext?.currency,
                creator_id: stepUpContext?.creator_id,
                email: stepUpContext?.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            });
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                setCaptchaToken("verified");
                buyItem("verified");
            } else {
                toast.error("Verification failed.");
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "OTP Verification failed.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    const executeCaptcha = (e) => {
        e.preventDefault();
        buyItem();
    };

    const buyItem = (token) => {
        if (!card_capabilities) {
             errorAlert("This creator cannot accept payments at the moment.");
             return false;
        }
        if (email === "" || name === "") {
            errorAlert("Please enter your name and email");
            return false;
        }

        if (shop.type === "physical") {
            if (!shipping_info.country) {
                errorAlert("Please select a shipping country");
                return false;
            }
            if (!shipping_info.street_address || !shipping_info.city || !shipping_info.state || !shipping_info.postal_code) {
                errorAlert("Please fill in all shipping address fields");
                return false;
            }
        }

        // If token is passed directly (e.g. from verify), use it, otherwise use state
        const currentToken = typeof token === "string" ? token : captchaToken;

        const captchaQuery = currentToken
            ? `&cf_turnstile_response=${encodeURIComponent(
                  currentToken
              )}&digital_waiver=1`
            : "&digital_waiver=1";
        
        setLoading(true);
        setChecking(true);
        if (shop.type === "physical") {
            axios
                .post(
                    `/shop/buy/${s.uuid}/no_varient?from=${name}&email=${email}&quantity=${quantity}&amount=${fairPrice}&country=${country}${captchaQuery}`,
                    {
                        shipping_info: JSON.stringify(shipping_info),
                    }
                )
                .then((res) => {
                    if (res.data.status == false) {
                        setLoading(false);
                        setChecking(false);
                        if (res.data.step_up_required) {
                            setStepUpData({ ui: res.data.ui });
                            setStepUpContext(res.data.step_up_context);
                            setShowStepUp(true);
                            if (turnstileRef.current) turnstileRef.current.reset();
                            return;
                        }
                        if (res.data.message === 'Login required' || res.data.code === 'AUTH_REQUIRED') {
                            const msg = res.data.msg || 'Guest checkout is disabled. Please log in.';
                            router.visit(
                                `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`
                            );
                        } else {
                            errorAlert(res.data.message || res.data.msg || "Transaction declined.");
                        }
                    } else if (res.data.url) {
                        window.location.href = res.data.url;
                    } else {
                        setLoading(false);
                        setChecking(false);
                        errorAlert(res.data.message || "Something went wrong");
                    }
                })
                .catch((err) => {
                    setLoading(false);
                    setChecking(false);
                    errorsHandling(err);
                });
        } else {
            axios
                .post(
                    `/shop/buy/${s.uuid}/no_varient?from=${name}&email=${email}&quantity=${quantity}&amount=${fairPrice}${captchaQuery}`
                )
                .then((res) => {
                    if (res.data.status == false) {
                        setLoading(false);
                        setChecking(false);
                        if (res.data.step_up_required) {
                            setStepUpData({ ui: res.data.ui });
                            setStepUpContext(res.data.step_up_context);
                            setShowStepUp(true);
                            if (turnstileRef.current) turnstileRef.current.reset();
                            return;
                        }
                        if (res.data.message === 'Login required' || res.data.code === 'AUTH_REQUIRED') {
                            const msg = res.data.msg || 'Guest checkout is disabled. Please log in.';
                            router.visit(
                                `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`
                            );
                        } else {
                            errorAlert(res.data.message || res.data.msg || "Transaction declined.");
                        }
                    } else if (res.data.url) {
                        window.location.href = res.data.url;
                    } else {
                        setLoading(false);
                        setChecking(false);
                        errorAlert(res.data.message || "Something went wrong");
                    }
                })
                .catch((err) => {
                    setLoading(false);
                    setChecking(false);
                    errorsHandling(err);
                });
        }
    };

    const [replySent, setReplySent] = useState(false);
    const [posting, setposting] = useState(false);
    const [reply, setReply] = useState();
    const inputref = useRef();

    const sendReply = async () => {
        setposting(true);
        axios
            .post(`/shop/answer-to-payment/${isPaid}`, {
                answer: reply,
            })
            .then((res) => {
                if (res.data.status) {
                    inputref.current.value = "";
                    setReply();
                    successAlert(res.data.msg || res.data.message);
                    setReplySent(true);
                } else {
                    errorAlert(res.data.msg || res.data.message);
                }
                setposting(false);
            })
            .catch((err) => {
                setposting(false);
                errorsHandling(err);
            });
    };

    const handleCopy = () => {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => {
                toast.success("Copied to clipboard");
            })
            .catch((err) => {
                console.error("Failed to copy: ", err);
            });
    };

    return (
        <>
            <Popup
                modalclass="pinkmodal sendSurprize-modal"
                space="4"
                size="md"
                action={close}
                classes={classes}
                text={text}
            >
                <div className={`${loading ? "item-purchasing" : ""}`}>
                    <div className="mx-auto w-32 h-32 relative -mt-16 border-2 border-white rounded-full overflow-hidden">
                        <img
                            className="object-cover object-center h-32 w-full"
                            src={s.user.avatar_url || userdefaultphoto}
                            alt="Woman looking front"
                        />
                    </div>
                    <div className="text-center mt-2">
                        <Link
                            href={`/${s.user.username}`}
                            className="font-semibold text-black"
                        >
                            {s.user.name || "User"}
                        </Link>
                    </div>

                    {isPaid && opened == 0 ? (
                        <>
                            <h2 className="text-center font-bold text-xl py-2">
                                Thank you for your purchase!
                            </h2>
                            <div className="border border-gray-200 p-3 rounded-[30px]  mt-4">
                                <div className="mb-3 shop-item flex justify-between w-full items-center bg-white rounded-[30px] ">
                                    <div className="shop-item-user w-full flex bg-gray-100 p-3 rounded-[30px]  items-center">
                                        <Link
                                            href={`/shop/item/${slug(s.name)}/${
                                                s.uuid
                                            }`}
                                            className="shop-img w-12 h-12 min-w-12"
                                        >
                                            <img
                                                className="w-full h-full object-cover rounded-[30px]  "
                                                src={s.perma_link}
                                                alt=""
                                            />
                                        </Link>
                                        <Link
                                            href={`/shop/item/${slug(s.name)}/${
                                                s.uuid
                                            }`}
                                            className="shop-text pl-3 "
                                        >
                                            <h2 className="text-md font-bold">
                                                {s.name}
                                            </h2>
                                            <p className="text-gray-500 text-sm line-clamp-1 ">
                                                {s.description}
                                            </p>
                                        </Link>
                                    </div>
                                </div>

                                {shop.type === "physical" ? (
                                    <div className="text-center py-2">
                                        <p className="text-gray-700 font-medium">📦 Your order has been placed!</p>
                                        <p className="text-sm text-gray-500 mt-1">The creator will process and ship your order soon. You&apos;ll receive an email with tracking details once it&apos;s dispatched.</p>
                                    </div>
                                ) : s && s.success_page_type == "text" ? (
                                    <p>{s && s.success_page_value}</p>
                                ) : (
                                    <a
                                        target="_blank"
                                        className="text-blue-800 break-all"
                                        href={s && s.success_page_value}
                                    >
                                        {s && s.success_page_value}
                                    </a>
                                )}

                                {s.ask_question && !replySent ? (
                                    <>
                                        <p className="text-start mt-3">
                                            {s.ask_question} ?
                                        </p>
                                        <input
                                            ref={inputref}
                                            onChange={(e) =>
                                                setReply(e.target.value)
                                            }
                                            className="text-black bg-gray-100 rounded-[30px]   w-full mt-2 px-3 py-2 border border-gray-200"
                                            type="text"
                                            placeholder="Ask your question ??"
                                        />
                                        {reply ? (
                                            <button
                                                onClick={sendReply}
                                                className="pinkbg text-center text-white px-3 py-1 mt-3 mx-auto block rounded-[30px] "
                                            >
                                                {posting ? "Posting" : "Post"}
                                            </button>
                                        ) : (
                                            ""
                                        )}
                                    </>
                                ) : (
                                    ""
                                )}
                            </div>

                            <div className="ShareSupport">
                                <h2 className="text-black font-bold text-center font-2xl mb-2 mt-10">
                                    Share your support
                                </h2>
                                <p className="text-center">
                                    {s.user.name} would love a shoutout! Share
                                    it out or tell your friends using this link:
                                </p>
                                <button
                                    onClick={handleCopy}
                                    className="bg-gray-200 rounded-[30px]  px-4 py-2 mx-auto block mt-3 text-sm"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center mt-2">
                                {fairPrice ? (
                                    <p className="text-gray-500 my-2 ">
                                        You will be charged{" "}
                                        <strong className="text-black">
                                            {formatMultiPrice(
                                            calculateTotalSupporterPays(
                                                ((parseFloat(fairPrice || s.price) || 0) * quantity) + ((parseFloat(shippingPrice) || 0) * quantity), 
                                                s?.currency || "GBP", 
                                                s?.user?.vat_amount_percentage || 0
                                            ),
                                            s?.currency || "GBP"
                                        )}
                                        </strong>
                                        <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight block">
                                            *Includes platform and payment processing fees and shipping. You will be charged in {s?.currency || "GBP"}.
                                        </span>
                                        <button className="tooltipbtn flex justify-center items-center !font-normal">
                                            ?
                                            <p className="!text-left">
                                                {window.platformFeePercentage || 20}% Card Fees and £1
                                                administrative fee applies to
                                                all transactions.
                                            </p>
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-gray-500 my-2 ">
                                        You will get it for free.
                                    </p>
                                )}
                            </div>
                            <div className="my-3 shop-item flex justify-between w-full items-center bg-white rounded-[30px] ">
                                <div className="shop-item-user w-full flex bg-gray-100 p-3 rounded-[30px]  items-center">
                                    <Link
                                        href={`/shop/item/${slug(s.name)}/${
                                            s.uuid
                                        }`}
                                        className="shop-img w-12 h-12 min-w-12"
                                    >
                                        <img
                                            className="w-full h-full object-cover rounded-[30px]  "
                                            src={s.perma_link}
                                            alt=""
                                        />
                                    </Link>
                                    <Link
                                        href={`/shop/item/${slug(s.name)}/${
                                            s.uuid
                                        }`}
                                        className="shop-text pl-3 "
                                    >
                                        <h2 className="text-md font-bold">
                                            {s.name}
                                        </h2>
                                        <p className="text-gray-500 text-sm line-clamp-1 ">
                                            {s.description}
                                        </p>
                                    </Link>
                                </div>
                            </div>
                            {/* <p className='mb-1' >Enter a fair price (optional)</p>
               <input required onChange={enterFairPrice} min={s.price}
               className="w-full border-gray-300 border px-4 py-2 rounded-[30px]  focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 mb-3" placeholder={`+${s.price}`} type="number" /> */}

                            <div className="form-field mb-3">
                                <p className="mb-1">Name</p>
                                <input
                                    required
                                    disabled={
                                        auth && auth.user?.name ? true : false
                                    }
                                    className="border-gray-300 border rounded-[30px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded"
                                    defaultValue={auth && auth.user?.name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    placeholder="Enter name.. "
                                />
                            </div>
                            <div className="form-field mb-3 ">
                                <p className="mb-1">Email</p>
                                <input
                                    required
                                    disabled={
                                        auth && auth.user?.email ? true : false
                                    }
                                    className="border-gray-300 border rounded-[30px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                                    defaultValue={auth && auth.user?.email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="Enter email.. "
                                />
                                <p className="text-[12px] text-gray-500 mt-1 ">
                                    Your email address is kept private and will
                                    not be shown to anyone.
                                </p>
                            </div>

                            {s.quantity_allow == 1 ? (
                                <div className="form-field mb-3">
                                    <p className="mb-1">Quantity</p>
                                    <input
                                        required
                                        min="1"
                                        max={s.slot_limitation !== null ? s.slot_limitation : undefined}
                                        className="border-gray-300 border rounded-[30px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                        value={quantity}
                                        onChange={(e) => {
                                            if (e.target.value === '') {
                                                setQuantity('');
                                                return;
                                            }
                                            let val = parseInt(e.target.value);
                                            if (isNaN(val) || val < 1) val = 1;
                                            if (s.slot_limitation !== null && val > s.slot_limitation) {
                                                val = s.slot_limitation;
                                            }
                                            setQuantity(val);
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                                setQuantity(1);
                                            }
                                        }}
                                        type="number"
                                        placeholder="1"
                                    />
                                </div>
                            ) : null}

                            {shop.type === "physical" ? (
                                <>
                                    <div className="mb-3">
                                        <p className="mb-2">
                                            Shipping Information
                                        </p>
                                        <select
                                            className="border-gray-300 border rounded-[30px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                                            name="country"
                                            onChange={handleShipInput}
                                        >
                                            <option value={""}>
                                                Choose Country
                                            </option>
                                            {AllContries &&
                                                AllContries.map((c, i) => (
                                                    <option
                                                        key={i}
                                                        value={c.code}
                                                    >
                                                        {c.label}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            required
                                            className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                                            onChange={handleShipInput}
                                            name="street_address"
                                            type="text"
                                            placeholder="Street Address"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            required
                                            className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                                            onChange={handleShipInput}
                                            name="city"
                                            type="text"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="mb-3">
                                            <input
                                                required
                                                className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                                                onChange={handleShipInput}
                                                name="state"
                                                type="text"
                                                placeholder="State"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <input
                                                required
                                                className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] "
                                                onChange={handleShipInput}
                                                name="postal_code"
                                                type="text"
                                                placeholder="Postal Code"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                ""
                            )}

                            {turnstileSiteKey ? (
                                <Turnstile
                                    ref={turnstileRef}
                                    size="normal"
                                    theme="light"
                                    onVerify={onVerify}
                                />
                            ) : null}

                            {!card_capabilities && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    <strong className="font-bold">Payment Unavailable: </strong>
                                    <span className="block sm:inline">This creator cannot receive payments yet.</span>
                                </div>
                            )}

                            <CheckoutLegalTerms onAgreeChange={(checked) => setDigitalWaiver(checked)} />

                            <button
                                disabled={checking || !card_capabilities || !digitalWaiver}
                                onClick={executeCaptcha}
                                className={`${
                                    checking || !card_capabilities || !digitalWaiver ? "opacity-[0.5] disabled" : ""
                                }  w-1/2 block mx-auto rounded-full bg-gray-900 hover:shadow-lg font-semibold text-white px-6 py-2`}
                            >
                                {checking ? "Buying.." : "Pay"}
                            </button>
                            <div className='securestripe text-center mt-3' >
                                🔒 Secured via <b>Stripe</b>
                            </div>
                        </>
                    )}
                </div>
            </Popup>
            
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
                                disabled={passkeyLoading || verifyingOtp}
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
        </>
    );
}
