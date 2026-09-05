import { rewardLines } from "@/constants/rewards";
import React from 'react';
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import PaymentMethodSelector from "@/Components/PaymentMethodSelector";
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
import { PayButton, OrderContextCard } from "@/Components/Checkout/SummaryReceipt";
import { fieldClass } from "@/Components/Checkout/FormKit";
import { creatorIdOf } from "@/utils/pricing";
import { riskMessageBody } from '@/constants/riskMessages';

export default function BuyShopItem({
    opened,
    classes,
    text,
    s,
    open,
    isPaid,
    country,
    onCountryChange,
    shippingPrice,
    card_capabilities,
}) {
    const { formatMultiPrice, adminFeeInCurrency, calculateTotalSupporterPays } = PriceFormat();
    const { auth, turnstileSiteKey, shop, platform_fee_percentage, transaction_fee_percentage } = usePage().props;
    const turnstileRef = useRef(null);
    const [close, setClose] = useState();

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
        // Re-quote shipping for the destination the buyer actually picked — it used
        // to be priced off their IP country and only the IP country was sent.
        if (e.target.name === "country") {
            onCountryChange?.(e.target.value);
        }
    };

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
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [previewPrices, setPreviewPrices] = useState(null);

    // One place for the checkout maths the receipt above and the pay button share.
    const isPhysicalItem = (s?.type ?? shop?.type) === "physical";
    const itemCurrency = (s?.currency || "GBP").toUpperCase();
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const itemSubtotal = (parseFloat(actualPrice() || s.price) || 0) * qty;
    const vatAmount = itemSubtotal * ((s?.user?.vat_amount_percentage || 0) / 100);
    const shippingTotal = isPhysicalItem ? (parseFloat(shippingPrice) || 0) * qty : 0;
    const baseBeforeFees = itemSubtotal + vatAmount + shippingTotal;
    const totalSupporterPays =
        paymentMethod === "bank" && previewPrices?.bank != null
            ? previewPrices.bank
            : calculateTotalSupporterPays(baseBeforeFees, itemCurrency, 0, creatorIdOf(s)).total_supporter_pays;


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
        // Re-entrancy guard: a second tap before the disabled re-render must not
        // fire a second checkout session.
        if (loading || checking) return false;
        if (paymentMethod === "card" && !card_capabilities) {
             errorAlert(riskMessageBody("CREATOR_UNAVAILABLE"));
             return false;
        }
        if (email.trim() === "" || name.trim() === "") {
            errorAlert("Please enter your name and email");
            return false;
        }
        // The email input is not inside a <form>, so native validation never runs.
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errorAlert("Please enter a valid email address");
            return false;
        }
        if (turnstileSiteKey && !captchaToken && typeof token !== "string") {
            errorAlert("Please wait a moment for the security check to finish, then try again.");
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

        // URLSearchParams, not string interpolation — a name containing "&", "+",
        // "#" or a space silently corrupted every one of these parameters.
        const params = new URLSearchParams({
            from: name,
            email,
            quantity: String(quantity),
            amount: String(actualPrice()),
            digital_waiver: "1",
        });
        if (shop.type === "physical") {
            params.set("country", shipping_info.country || country || "");
        }
        if (currentToken) {
            params.set("cf_turnstile_response", currentToken);
        }
        const query = params.toString();
        
        setLoading(true);
        setChecking(true);
        if (shop.type === "physical") {
            axios
                .post(
                    `/shop/buy/${s.uuid}?${query}`,
                    {
                        shipping_info: JSON.stringify(shipping_info),
                        payment_method: paymentMethod,
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
                            const msg = res.data.msg || riskMessageBody("GUEST_ACCOUNT_REQUIRED");
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
                    `/shop/buy/${s.uuid}?${query}`,
                    { payment_method: paymentMethod }
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
                            const msg = res.data.msg || riskMessageBody("GUEST_ACCOUNT_REQUIRED");
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
                            alt={s.user.name || "Creator"}
                            onError={(e) => { if (e.target.src !== userdefaultphoto) e.target.src = userdefaultphoto; }}
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
                            <div className="border border-gray-200 p-3 rounded-box mt-4">

                                {shop.type === "physical" ? (
                                    <div className="text-center py-2">
                                        <p className="text-black/80 font-medium">📦 Your order has been placed!</p>
                                        <p className="text-sm text-black/60 mt-1">The creator will process and ship your order soon. You&apos;ll receive an email with tracking details once it&apos;s dispatched.</p>
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

                                {/* The actual delivered file — the success screen used to
                                    describe the purchase but never link the content. */}
                                {shop.type !== "physical" && s?.reward_file_url && (
                                    <a
                                        href={s.reward_file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 w-full flex items-center justify-center gap-2 bg-[#FF007F] text-black font-black uppercase text-sm px-4 py-3 min-h-[44px] rounded-box-sm border-2 border-black active:translate-x-[2px] active:translate-y-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all"
                                    >
                                        ⬇ Download your content
                                    </a>
                                )}

                                <Link
                                    href="/shop?type=purchases"
                                    className="mt-3 block text-center text-sm font-bold text-black/80 underline underline-offset-2 hover:text-black"
                                >
                                    View all my purchases
                                </Link>

                                {s.ask_question && !replySent ? (
                                    <>
                                        <p className="text-start mt-3">
                                            {s.ask_question}
                                        </p>
                                        <input
                                            ref={inputref}
                                            onChange={(e) =>
                                                setReply(e.target.value)
                                            }
                                            className="text-black bg-gray-100 rounded-box-sm w-full mt-2 px-3 py-3 min-h-[44px] border border-gray-200"
                                            type="text"
                                            placeholder="Type your answer…"
                                        />
                                        {reply ? (
                                            <button
                                                onClick={sendReply}
                                                disabled={posting}
                                                className="pinkbg text-center text-black px-4 py-3 min-h-[44px] mt-3 mx-auto block rounded-full active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all disabled:opacity-50"
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
                                    className="bg-gray-200 rounded-box-sm px-4 py-3 min-h-[44px] mx-auto block mt-3 text-sm"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <OrderContextCard
                                className="mt-3"
                                image={s?.perma_link}
                                typeBadge={isPhysicalItem ? "Shop item · Ships to you" : "Shop item · Digital"}
                                itemTitle={s?.name}
                                itemSub={s?.description}
                                creatorName={s?.user?.name}
                                creatorUsername={s?.user?.username}
                                creatorAvatar={s?.user?.avatar_url}
                                whatYouGet={
                                    isPhysicalItem
                                        ? [
                                              ...rewardLines(s),
                                              "This item shipped to your address",
                                              qty > 1 ? `${qty} units` : "1 unit",
                                              "Order confirmation and tracking by email",
                                          ]
                                        : [
                                              ...rewardLines(s),
                                              "Instant access to the digital file after payment",
                                              "A copy sent to your email",
                                              "Yours to keep — lifetime access",
                                          ]
                                }
                            />

                            {/* Itemised, so the buyer can see what the total is made of
                                rather than one grossed-up number. */}
                            <div className="mt-3 border-2 border-black rounded-box bg-white p-4">
                                {actualPrice() ? (
                                    <>
                                        <div className="flex justify-between text-sm font-bold text-black/80 py-1">
                                            <span>Item{qty > 1 ? ` × ${qty}` : ""}</span>
                                            <span>{formatMultiPrice(itemSubtotal, itemCurrency)}</span>
                                        </div>
                                        {vatAmount > 0 && (
                                            <div className="flex justify-between text-sm font-bold text-black/80 py-1">
                                                <span>VAT ({s?.user?.vat_amount_percentage}%)</span>
                                                <span>{formatMultiPrice(vatAmount, itemCurrency)}</span>
                                            </div>
                                        )}
                                        {isPhysicalItem && (
                                            <div className="flex justify-between text-sm font-bold text-black/80 py-1">
                                                <span>Shipping{shipping_info.country ? ` to ${shipping_info.country}` : ""}</span>
                                                <span>{shippingTotal > 0 ? formatMultiPrice(shippingTotal, itemCurrency) : "Free"}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm font-bold text-black/80 py-1">
                                            <span>Platform &amp; processing fees</span>
                                            <span>{formatMultiPrice(Math.max(0, totalSupporterPays - baseBeforeFees), itemCurrency)}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline border-t-2 border-black mt-2 pt-2">
                                            <span className="font-black uppercase tracking-wide">Total</span>
                                            <strong className="text-2xl font-black">
                                                {formatMultiPrice(totalSupporterPays, itemCurrency)}
                                            </strong>
                                        </div>
                                        <p className="text-[12px] text-black/60 font-normal mt-2 leading-tight">
                                            You will be charged in {itemCurrency}.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-black/60 my-2 text-center">
                                        You will get it for free.
                                    </p>
                                )}
                            </div>
                            <div className="my-3 shop-item flex justify-between w-full items-center bg-white rounded-box">
                                <div className="shop-item-user w-full flex bg-gray-100 p-3 rounded-box items-center">
                                    <Link
                                        href={`/shop/item/${slug(s.name)}/${
                                            s.uuid
                                        }`}
                                        className="shop-img w-12 h-12 min-w-12"
                                    >
                                        <img
                                            className="w-full h-full object-cover rounded-box-sm"
                                            src={s.perma_link}
                                            alt={s.name || "Product"}
                                            onError={(e) => {
                                                if (e.target.dataset.fallback) return;
                                                e.target.dataset.fallback = "1";
                                                // innerHTML on an <img> does nothing — hide the broken image instead.
                                                e.target.style.backgroundColor = "#f3f4f6";
                                                e.target.style.visibility = "hidden";
                                            }}
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
                                        <p className="text-black/60 text-sm line-clamp-1 ">
                                            {s.description}
                                        </p>
                                    </Link>
                                </div>
                            </div>

                            <div className="form-field mb-3">
                                <label htmlFor="buy-shop-name" className="mb-1 block">Name</label>
                                <input
                                    id="buy-shop-name"
                                    required
                                    disabled={
                                        auth && auth.user?.name ? true : false
                                    }
                                    className={fieldClass}
                                    defaultValue={auth && auth.user?.name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    placeholder="Enter name.. "
                                />
                            </div>
                            <div className="form-field mb-3 ">
                                <label htmlFor="buy-shop-email" className="mb-1 block">Email</label>
                                <input
                                    id="buy-shop-email"
                                    required
                                    disabled={
                                        auth && auth.user?.email ? true : false
                                    }
                                    className={fieldClass}
                                    defaultValue={auth && auth.user?.email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="Enter email.. "
                                />
                                <p className="text-[12px] text-black/60 mt-1 ">
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
                                        className={fieldClass}
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
                                        <p className="mb-2 font-bold text-black/80">
                                            Shipping Information <span className="text-red-500">*</span>
                                        </p>
                                        <select
                                            required
                                            className={fieldClass}
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
                                            className={fieldClass}
                                            onChange={handleShipInput}
                                            name="street_address"
                                            type="text"
                                            placeholder="Street Address *"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            required
                                            className={fieldClass}
                                            onChange={handleShipInput}
                                            name="city"
                                            type="text"
                                            placeholder="City *"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="mb-3">
                                            <input
                                                required
                                                className={fieldClass}
                                                onChange={handleShipInput}
                                                name="state"
                                                type="text"
                                                placeholder="State *"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <input
                                                required
                                                className={fieldClass}
                                                onChange={handleShipInput}
                                                name="postal_code"
                                                type="text"
                                                placeholder="Postal Code *"
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

                            {paymentMethod === "card" && !card_capabilities && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    <strong className="font-bold">Payment Unavailable: </strong>
                                    <span className="block sm:inline">This creator cannot receive card payments yet. Try paying by bank above.</span>
                                </div>
                            )}

                            {(s?.payment_methods_accepted ?? "both") !== "card" && (
                                <PaymentMethodSelector
                                    amount={baseBeforeFees}
                                    currency={s?.currency || "GBP"}
                                    email={email}
                                    creatorId={creatorIdOf(s)}
                                    value={paymentMethod}
                                    onChange={setPaymentMethod}
                                    onPrices={setPreviewPrices}
                                    className="mb-4"
                                />
                            )}

                            <CheckoutLegalTerms onAgreeChange={(checked) => setDigitalWaiver(checked)} />

                            <div className="mt-4">
                                <PayButton
                                    label="Pay"
                                    processing={checking}
                                    disabled={(paymentMethod === "card" && !card_capabilities) || !digitalWaiver}
                                    onClick={executeCaptcha}
                                />
                            </div>
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
                space="0"
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
                                disabled={passkeyLoading || verifyingOtp}
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
        </>
    );
}
