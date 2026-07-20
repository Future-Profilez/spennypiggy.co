import { useEffect, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import cartproductimg from '../../../assets/img/cartproductimg.png';
import { useAlerts } from "@/Components/Alerts";
import { Toaster } from "react-hot-toast";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import Popup from "@/Components/Popup";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import PaymentMethodSelector from "@/Components/PaymentMethodSelector";

export default function SubCheckout(props) {
    const { flash, global_currency, rates, platform_fee_percentage, transaction_fee_percentage } = usePage().props;
    const {auth, user, wish, reccure, vat_amount  } = props;
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const [name, setName] = useState(auth && auth.user && auth.user.name || '');
    const [email, setEmail] = useState(auth && auth.user && auth.user.email || '');
    const { successAlert, errorAlert, warningAlert, infoAlert } = useAlerts();
    const {data, setData, post, processing, errors} = useForm({
        name: name,
        email: email,
        message: '',
        agree: false,
        digital_waiver: false,
        anonymous: 0,
        payment_method: 'card',
    });
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
        if (!auth?.user) {
            if (guestAllowed === false) {
                const msg = "Guest checkout is disabled. Please log in.";
                errorAlert(msg);
                window.location = `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`;
                return;
            }
            const total = calculateTotalSupporterPays(wish?.price, wish?.currency, wish?.user?.vat_amount_percentage || 0);
            const wishCurrency = (wish?.currency || "GBP").toUpperCase();
            const rate = rates?.[wishCurrency];
            const totalGbp = rate ? total / rate : total;
            if (totalGbp > 50) {
                errorAlert("Larger payments more than £50 need to login.");
                window.location = `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent("Larger payments more than £50 need to login.")}`;
                return;
            }
        }
        post(route(`wish.subscribe.checkout`,{
            uuid:wish.uuid,
            reccure:reccure
        }),
        {
            preserveScroll:true
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
                    const msg = "Guest checkout is disabled. Please log in.";
                    errorAlert(msg);
                    window.location = `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`;
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
                        <h2 className="pb-1 wishtitle">
                            Wish Basket for {wish?.user?.name || " "}
                            <Link className="text-violet-600" target="_blank"
                                href={`/${wish?.user?.username || ""}`} >
                                @{wish?.user?.username || ""}
                            </Link>
                        </h2>
                        <p className="pb-4">
                            You are about to subscribe to
                            <strong> {wish?.user?.name || ""} </strong> to fund their
                            wishes.
                        </p>
                        <div className="CartItemBox">
                            <div className={`border cartlist flex flex-wrap justify-between items-center content-between items-center border-voilet shadow-voilet rounded-[30px]   mb-3 md:mb-4 lg:mb-5 p-3 md:p-4`}>
                                <div className='prodcartbox items-center'>
                                    <div className='productimg'>
                                        <img src={wish.perma_link || cartproductimg} alt='img' />
                                    </div>
                                    <div>
                                        <div className='cartProdTitle pl-3'>{wish.wishname}</div>
                                        {/* {data.message ? <div className='surprise-message ps-3'>Surprise Message : {data.message}</div> : ''} */}
                                        <div className="inline-block px-2 py-1 bg-blue-100 text-gray-800 rounded mr-4 ml-3">
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
                                <strong className="text-gray-900 text-xl">Total:</strong>
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
                                        <div className="text-sm text-gray-500 font-medium mt-1">
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
                            <span className="text-[10px] mb-4 text-gray-500 font-normal mt-1 leading-tight block">
                                *Includes platform and payment processing fees. You will be charged in {wish?.currency}.
                            </span>
                        </div>

                        <div className="addMessage">
                            <form onSubmit={handleSubmit}>
                                <ul className="flex flex-wrap">
                                    <li className="w-full">
                                        <label>Add Message </label>
                                        <textarea
                                            className="w-full border-gray-300 border rounded-[30px]   px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[30px]  "
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
                                                    className="border-gray-300 border rounded-[30px]   px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
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
                                                <p className="text-sm text-gray-500 mb-1">Your e-mail remains private.</p>
                                                <input className={`${auth && auth.user && auth.user.email ? 'disabled' : ''} border-gray-300 border rounded-[30px]   px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500`}
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
                                    <p className="text-gray-500 text-sm mb-3" >Your personal email and name will be private.</p>
                                    
                                    {reccure == 'onetime' && (
                                        <PaymentMethodSelector
                                            amount={(parseFloat(String(wish?.price || 0).replace(/,/g, '')) || 0) * (1 + (parseFloat(wish?.user?.vat_amount_percentage) || 0) / 100)}
                                            currency={wish?.currency || 'GBP'}
                                            email={data.email || auth?.user?.email}
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
                                    </li>
                                </ul>
                                <div className="mt-4 flex items-center justify-center" >
                                    <button type="submit"
                                        className={`${!data.agree || !data.digital_waiver || processing ? "disabled" : ""} main-button p`}
                                        disabled={!data.agree || !data.digital_waiver || processing}>
                                        {processing ? 'Processing...' : `${reccure == 'onetime' ? `Subscribe Once ` : `Subscribe ${wish.subscription_period}`} `}
                                    </button>
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
                    <p className="text-gray-600 mb-6 text-center">
                        {stepUpData?.ui?.body || "For your security, please confirm this payment."}
                    </p>
                    <form onSubmit={handleVerifyStepUp}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP Code (Check your email)</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
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
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
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
                                className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                            >
                                {passkeyLoading ? "Checking device..." : "Use Face ID / Fingerprint"}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
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
