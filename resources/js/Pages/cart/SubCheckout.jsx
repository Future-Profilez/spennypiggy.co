import { rewardLines } from "@/constants/rewards";
import { useCallback, useEffect, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import cartproductimg from '../../../assets/img/cartproductimg.png';
import { useAlerts } from "@/Components/Alerts";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import Popup from "@/Components/Popup";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import PaymentMethodSelector from "@/Components/PaymentMethodSelector";
import Turnstile from "@/Components/Turnstile";
import { PayButton, OrderContextCard } from "@/Components/Checkout/SummaryReceipt";
import { fieldClass } from "@/Components/Checkout/FormKit";
import { feeRatesFor, supporterTotal, creatorIdOf } from "@/utils/pricing";
import { riskMessageBody, redirectToLoginWithMessage, GUEST_VALUE_THRESHOLD_GBP } from '@/constants/riskMessages';

export default function SubCheckout(props) {
    const { flash, global_currency, rates, platform_fee_percentage, transaction_fee_percentage, turnstileSiteKey } = usePage().props;
    const __pageProps = usePage().props;
    const {auth, user, wish, reccure, vat_amount  } = props;
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const [name, setName] = useState(auth && auth.user && auth.user.name || '');
    const [email, setEmail] = useState(auth && auth.user && auth.user.email || '');
    const { successAlert, errorAlert, warningAlert, infoAlert } = useAlerts();
    const turnstileRef = useRef(null);
    const [verified, setVerified] = useState(false);
    /*
     * 🚨 useForm MUST come before the useCallback below.
     *
     * A hook's dependency array is evaluated EAGERLY — it is a plain argument,
     * unlike the callback body, which is deferred. So `[setData]` listed above
     * this declaration read `setData` inside its temporal dead zone and threw
     * "Cannot access 'm' before initialization" on EVERY render: this whole
     * checkout was dead for every visitor, and the build could not see it.
     *
     * MemberCheckout.jsx already has the correct order — match it.
     */
    const {data, setData, post, processing, errors} = useForm({
        name: name,
        email: email,
        message: '',
        agree: false,
        digital_waiver: false,
        anonymous: 0,
        payment_method: 'card',
        cf_turnstile_response: '',
    });

    // Stable identity so Turnstile's render effect doesn't remount the widget on re-render.
    const onTurnstileVerify = useCallback((token) => {
        setData("cf_turnstile_response", token || "");
        setVerified(!!token);
    }, [setData]);
    const [previewPrices, setPreviewPrices] = useState(null);

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

        // The gross-up itself lives in ONE place (utils/pricing). This screen
        // used to carry its own copy reading the GLOBAL fee props, which cannot
        // express a per-creator rate — so a creator on a bespoke deal was QUOTED
        // the standard price here while checkout CHARGED theirs.
        const __rates = feeRatesFor(creatorIdOf(wish), __pageProps);
        const totalSupporterPays = supporterTotal(priceWithVat, {
            ...__rates,
            adminFee: adminFeeInCurrency(curr),
            isZeroDecimal,
        });

        return totalSupporterPays;
};

    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    function checkanonymous(e){
        setKeepAnonmyous(e.target.checked);
        if(e.target.checked){
            setData("anonymous", 1)
        } else {
            setData("anonymous", 0)
        }
    }

    const submitCheckout = () => {
        // Re-entrancy guard: a second tap before the disabled re-render must not
        // fire a second checkout session.
        if (processing) return;
        if (turnstileSiteKey && !verified && !data.cf_turnstile_response) {
            errorAlert("Please complete the security check.");
            return;
        }
        if (!auth?.user) {
            if (guestAllowed === false) {
                errorAlert(riskMessageBody("GUEST_ACCOUNT_REQUIRED"));
                redirectToLoginWithMessage("GUEST_ACCOUNT_REQUIRED");
                return;
            }
            const total = calculateTotalSupporterPays(wish?.price, wish?.currency, wish?.user?.vat_amount_percentage || 0);
            const wishCurrency = (wish?.currency || "GBP").toUpperCase();
            const rate = rates?.[wishCurrency];
            const totalGbp = rate ? total / rate : total;
            // ⚠️ The threshold is never named in the copy — see
            // constants/riskMessages.js. The server refuses this too.
            if (totalGbp > GUEST_VALUE_THRESHOLD_GBP) {
                errorAlert(riskMessageBody("GUEST_ACCOUNT_REQUIRED_VALUE"));
                redirectToLoginWithMessage("GUEST_ACCOUNT_REQUIRED_VALUE");
                return;
            }
        }
        post(route(`wish.subscribe.checkout`,{
            uuid:wish.uuid,
            reccure:reccure
        }),
        {
            preserveScroll:true,
            onError: (errorBag) => {
                const first = errorBag && Object.values(errorBag).flat()[0];
                if (first) errorAlert(String(first));
                setVerified(false);
                setData("cf_turnstile_response", "");
                if (turnstileRef.current) {
                    turnstileRef.current.reset();
                }
            },
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        submitCheckout();
    }

    const [guestAllowed, setGuestAllowed] = useState(null);

    const [showStepUp, setShowStepUp] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [typedConfirmation, setTypedConfirmation] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [stepUpContext, setStepUpContext] = useState(null);
    const [stepUpData, setStepUpData] = useState(null);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);
    useEffect(() => {
        if(flash?.error){
            errorAlert(flash.error);
        }
        if(flash?.success){
            successAlert(flash.success);
        }
        if(flash?.warning){
            warningAlert(flash.warning);
        }
        if(flash?.info){
            infoAlert(flash.info);
        }
        if (flash?.step_up_required) {
            setStepUpContext(flash.step_up_context || null);
            setStepUpData(flash.step_up_data || null);
            setOtpCode("");
            setTypedConfirmation("");
            setShowStepUp(true);
        }
    },[flash]);

    useEffect(() => {
        if (auth?.user) {
            setGuestAllowed(true);
            return;
        }
        axios.get("/api/risk/limits")
            .then((res) => {
                const allowed = res?.data?.guest_allowed !== false;
                setGuestAllowed(allowed);
                if (!allowed) {
                    errorAlert(riskMessageBody("GUEST_ACCOUNT_REQUIRED"));
                    redirectToLoginWithMessage("GUEST_ACCOUNT_REQUIRED");
                }
            })
            .catch(() => {
                setGuestAllowed(true);
            });
    }, [auth?.user?.id]);

    const arrayBufferToBase64 = (buffer) => {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatCredentialForServer = (credential) => {
        if (!credential) return null;

        const formatted = {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type,
            response: {
                authenticatorData: arrayBufferToBase64(
                    credential.response.authenticatorData,
                ),
                clientDataJSON: arrayBufferToBase64(
                    credential.response.clientDataJSON,
                ),
                signature: arrayBufferToBase64(credential.response.signature),
                userHandle: credential.response.userHandle
                    ? arrayBufferToBase64(credential.response.userHandle)
                    : null,
            },
        };

        if (credential.response.attestationObject) {
            formatted.response.attestationObject = arrayBufferToBase64(
                credential.response.attestationObject,
            );
        }

        return formatted;
    };

    const base64urlToUint8Array = (base64url) => {
        const base64 = base64url
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(
                base64url.length + ((4 - (base64url.length % 4)) % 4),
                "=",
            );

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

    useEffect(() => {
        const checkPasskey = async () => {
            const userEmail = stepUpContext?.email || data?.email || email || auth?.user?.email;
            if (userEmail && isWebAuthnSupported()) {
                try {
                    const res = await axios.post("/webauthn/check", {
                        email: userEmail,
                    });
                    setHasPasskey(res.data.has_passkey);
                } catch (e) {
                    setHasPasskey(false);
                }
            }
        };
        if (showStepUp) {
            checkPasskey();
        }
    }, [showStepUp, stepUpContext?.email, data?.email, email, auth?.user?.email]);

    const handlePasskeyStepUp = async () => {
        try {
            setPasskeyLoading(true);
            const userEmail = stepUpContext?.email || data?.email || email || auth?.user?.email;
            if (!userEmail) {
                errorAlert("Email required for passkey verification.");
                return;
            }

            const { data: options } = await axios.post(
                route("webauthn.login.options"),
                { email: userEmail },
            );

            const publicKey = options.publicKey ?? options;
            publicKey.challenge = base64urlToUint8Array(publicKey.challenge);
            if (publicKey.allowCredentials) {
                publicKey.allowCredentials = publicKey.allowCredentials.map(
                    (item) => ({
                        ...item,
                        id: base64urlToUint8Array(item.id),
                    }),
                );
            }

            const credential = await navigator.credentials.get({ publicKey });

            const total = calculateTotalSupporterPays(wish?.price, wish?.currency, wish?.user?.vat_amount_percentage || 0);
            const amountMinor = Math.round(
                total * (isZeroDecimalCurrency(wish?.currency) ? 1 : 100),
            );

            const payload = {
                ...formatCredentialForServer(credential),
                amount: stepUpContext?.amount || amountMinor,
                currency: stepUpContext?.currency || (wish?.currency || "GBP"),
                creator_id: stepUpContext?.creator_id || wish?.user?.uuid || wish?.user?.id,
                email: userEmail,
                device_id: stepUpContext?.device_id,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id,
            };

            const response = await axios.post(
                "/api/risk/step-up/verify-passkey",
                payload,
            );

            if (response.data.success) {
                successAlert("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                submitCheckout();
            } else {
                errorAlert("Passkey verification failed.");
            }
        } catch (error) {
            if (error.response?.data?.error) {
                errorAlert(error.response.data.error);
            } else if (error.name === "NotAllowedError") {
                errorAlert("Authentication cancelled.");
            } else {
                errorAlert("Unable to authenticate. Please try again.");
            }
        } finally {
            setPasskeyLoading(false);
        }
    };

    const handleVerifyStepUp = async (e) => {
        e.preventDefault();
        setVerifyingOtp(true);
        try {
            const total = calculateTotalSupporterPays(wish?.price, wish?.currency, wish?.user?.vat_amount_percentage || 0);
            const amountMinor = Math.round(
                total * (isZeroDecimalCurrency(wish?.currency) ? 1 : 100),
            );

            const response = await axios.post("/api/risk/step-up/verify", {
                otp: otpCode,
                typed_confirmation: typedConfirmation,
                amount: stepUpContext?.amount || amountMinor,
                currency: stepUpContext?.currency || (wish?.currency || "GBP"),
                creator_id: stepUpContext?.creator_id || wish?.user?.uuid || wish?.user?.id,
                email: stepUpContext?.email || data?.email || email || auth?.user?.email,
                device_id: stepUpContext?.device_id,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id,
            });

            if (response.data.success) {
                successAlert("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                submitCheckout();
            } else {
                errorAlert("Verification failed.");
            }
        } catch (error) {
            errorAlert(error.response?.data?.error || "OTP Verification failed.");
        } finally {
            setVerifyingOtp(false);
        }
    };

    return (
        <>
        <Authenticated auth={auth.user} user={user}>
            <Head title={`Subscribe -${wish?.wishname}`}/>
            <div className={`px-0 pb-3 lg:px-2 bg-white py-12`}>
                <div className="my-4 cartsub cartPage bg-white p-4 md:p-5 ">
                    <div className="cartMain">
                        <h2 className="pb-1 wishtitle font-black uppercase">Checkout</h2>
                        <OrderContextCard
                            className="mb-4"
                            image={wish.perma_link}
                            typeBadge={reccure == 'onetime' ? 'One-off content' : 'Content subscription'}
                            itemTitle={wish.wishname}
                            itemSub={wish.content_description || wish.description}
                            payingLabel="You're unlocking from"
                            creatorName={wish?.user?.name}
                            creatorUsername={wish?.user?.username}
                            creatorAvatar={wish?.user?.avatar_url}
                            whatYouGet={
                                reccure == 'onetime'
                                    ? [
                                          ...rewardLines(wish),
                                          "Instant access to this content after payment",
                                          "A copy sent to your email",
                                          "Yours to keep — one-time payment",
                                      ]
                                    : [
                                          ...rewardLines(wish),
                                          `New content from this creator every ${wish.subscription_period || 'cycle'}`,
                                          "Delivered while your subscription is active",
                                          "Cancel anytime from your purchases",
                                      ]
                            }
                        />
                        <div className="CartItemBox">
                            <div className={`border cartlist flex flex-wrap justify-between items-center content-between items-center border-voilet rounded-box mb-3 md:mb-4 lg:mb-5 p-3 md:p-4`}>
                                <div className='prodcartbox items-center'>
                                    <div className='productimg'>
                                        <img src={wish.perma_link || cartproductimg} alt={wish.wishname || "Product"} />
                                    </div>
                                    <div>
                                        <div className='cartProdTitle pl-3'>{wish.wishname}</div>
                                        {/* {data.message ? <div className='surprise-message ps-3'>Surprise Message : {data.message}</div> : ''} */}
                                        <div className="inline-block px-2 py-1 bg-blue-100 text-black rounded mr-4 ml-3">
                                        Pay {reccure == 'onetime' ? `Onetime` : wish.subscription_period}
                                    </div>
                                    </div>
                                </div>
                                <div className='cartProRtbox mt-3 items-center'>

                                    <div className='cartPric pr-4'>
                                        {formatMultiPrice(
                                            data.payment_method === 'bank' && previewPrices?.bank != null
                                                ? previewPrices.bank
                                                : calculateTotalSupporterPays(wish.price, wish?.currency, wish?.user?.vat_amount_percentage || 0),
                                            wish && wish.currency
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="cartTotal justify-end px-0 py-3">
                            <div className="cartSubTotal mt-1 mb-4">
                                <strong className="text-black text-xl">Total:</strong>
                                <span className=" text-black">
                                    <strong className="block text-xl">
                                        {formatMultiPrice(
                                            data.payment_method === 'bank' && previewPrices?.bank != null
                                                ? previewPrices.bank
                                                : calculateTotalSupporterPays(wish.price, wish?.currency, wish?.user?.vat_amount_percentage || 0),
                                            wish && wish.currency
                                        )}
                                    </strong>
                                    {global_currency && global_currency.toUpperCase() !== (wish?.currency || '').toUpperCase() && (
                                        <div className="text-sm text-black/60 font-medium mt-1">
                                            ≈ {formatMultiPrice(
                                                data.payment_method === 'bank' && previewPrices?.bank != null
                                                    ? previewPrices.bank
                                                    : calculateTotalSupporterPays(wish.price, wish?.currency, wish?.user?.vat_amount_percentage || 0),
                                                global_currency
                                            )} (estimated)
                                        </div>
                                    )}
                                </span>
                            </div>
                            <span className="text-[12px] mb-4 text-black/60 font-normal mt-1 leading-tight block">
                                *Includes platform and payment processing fees. You will be charged in {wish?.currency}.
                            </span>
                        </div>

                        <div className="addMessage">
                            <form onSubmit={handleSubmit}>
                                <ul className="flex flex-wrap">
                                    <li className="w-full">
                                        <label>Add Message </label>
                                        <textarea
                                            className={fieldClass}
                                            onKeyUp={(e) =>
                                                setData('message',e.target.value)
                                            }
                                            placeholder="Write message in under 800 Words..."
                                            defaultValue={data.message}
                                        ></textarea>
                                        <span className="text-xs text-red-600">{errors.message}</span>
                                    </li>
                                    <li className="w-full mt-3">
                                        <div className="flex flex-wrap">
                                            <div className="w-full mb-4">
                                                <label className="block !text-start w-full">
                                                    From
                                                </label>
                                                <input
                                                    className={fieldClass}
                                                    onChange={(e) =>
                                                        setData('name',e.target.value)
                                                    } value={data.name}
                                                    type="text"
                                                    placeholder="Enter Your Name..."
                                                />
                                                <span className="text-xs text-red-600">{errors.name}</span>
                                            </div>
                                            <div className="w-full mb-4">
                                                <label className="block !text-start w-full">Email </label>
                                                <p className="text-sm text-black/60 mb-1">Your e-mail remains private.</p>
                                                <input className={fieldClass}
                                                    value={data.email}
                                                    disabled={auth && auth.user && auth.user.email ? true : false}
                                                    onChange={(e) => setData('email',e.target.value)}
                                                    type="email" placeholder="Enter Your Email..."
                                                />
                                                <span className="text-xs text-red-600">{errors.email}</span>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="cheklistbox">
                                    <label
                                        htmlFor="anonymous"
                                        className="text-left" >
                                        <input
                                            onChange={checkanonymous}
                                            type="checkbox"
                                            id="anonymous"
                                            name="anonymous"
                                            className="mr-2"
                                            value="anonymous" ></input> Keep anonymous
                                    </label>
                                    <p className="text-black/60 text-sm mb-3" >Your personal email and name will be private.</p>
                                    
                                    {reccure == 'onetime' && (
                                        <PaymentMethodSelector
                                            amount={(parseFloat(String(wish?.price || 0).replace(/,/g, '')) || 0) * (1 + (parseFloat(wish?.user?.vat_amount_percentage) || 0) / 100)}
                                            currency={wish?.currency || 'GBP'}
                                            email={data.email || auth?.user?.email}
                                            creatorId={creatorIdOf(wish)}
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
                                    </li>
                                </ul>
                                <div className="mt-4" >
                                    <PayButton
                                        label={
                                            reccure == 'onetime'
                                                ? 'Subscribe Once'
                                                // ⚠️ A wish with subscription=0 has a NULL period, and this
                                                // route is still reachable for it — the button read
                                                // "Subscribe null" on the last screen before payment.
                                                : `Subscribe${wish?.subscription_period ? ' ' + wish.subscription_period : ''}`
                                        }
                                        processing={processing}
                                        disabled={!data.agree || !data.digital_waiver || (turnstileSiteKey && !verified)}
                                        onClick={submitCheckout}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <Popup
                size="md"
                action={showStepUp}
                space="p-0"
                modalclass="pinkmodal"
                classes="hidden"
            >
                <div className="!rounded-none p-6">
                    <h2 className="text-xl font-bold mb-2 text-center">{stepUpData?.ui?.title || "Confirm Your Payment"}</h2>
                    <p className="text-black/60 mb-6 text-center">
                        {stepUpData?.ui?.body || "For your security, please confirm this payment."}
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
                                disabled={verifyingOtp || !otpCode || typedConfirmation.toUpperCase() !== "CONFIRM"}
                                className={`w-full main-button p ${(!otpCode || typedConfirmation.toUpperCase() !== "CONFIRM" || verifyingOtp) ? "disabled" : ""}`}
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
                                {passkeyLoading ? "Checking device..." : "Use Face ID / Fingerprint"}
                            </button>
                            <p className="text-xs text-black/60 text-center mt-2">
                                Bypass OTP by verifying your identity with a saved passkey.
                            </p>
                        </div>
                    )}
                </div>
            </Popup>
        </Authenticated>
        </>
    );
}
