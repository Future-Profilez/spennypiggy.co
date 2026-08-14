import { rewardLines } from "@/constants/rewards";
import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Turnstile from "@/Components/Turnstile";
import Popup from "@/Components/Popup";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import SummaryReceipt, { PayButton, SectionLabel } from "@/Components/Checkout/SummaryReceipt";
import { fieldClass } from "@/Components/Checkout/FormKit";
import axios from "axios";
import { feeRatesFor, creatorIdOf, STRIPE_FEE_RATE, STRIPE_FIXED_FEE } from "@/utils/pricing";

export default function BillCheckout(props) {
    const {
        user,
        auth,
        turnstileSiteKey,
        flash,
        rates,
        platform_fee_percentage,
        transaction_fee_percentage,
    } = usePage().props;
    const __pageProps = usePage().props;
    const turnstileRef = useRef(null);
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const {
        bill,
        vat_amount,
        card_capabilities,
        creator_currency,
        display_currency,
    } = props;

    const [name, setName] = useState(
        (auth && auth.user && auth.user.name) || "",
    );
    const [email, setEmail] = useState(
        (auth && auth.user && auth.user.email) || "",
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
            "BIF",
            "CLP",
            "DJF",
            "GNF",
            "JPY",
            "KMF",
            "KRW",
            "MGA",
            "PYG",
            "RWF",
            "UGX",
            "VND",
            "VUV",
            "XAF",
            "XOF",
            "XPF",
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
    const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
        const listedPrice = parseFloat(String(price || 0).replace(/,/g, ""));
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        const vatAmount = (listedPrice * (parseFloat(vatPercent) || 0)) / 100;
        const priceWithVat = listedPrice + vatAmount;

        // Constants must match backend configuration (Helpers.php)
        const stripeFeeRate = STRIPE_FEE_RATE;
        const stripeFixedFee = isZeroDecimal ? 0 : STRIPE_FIXED_FEE;
        // Per-creator: a creator on a bespoke platform rate must be QUOTED
        // what checkout will CHARGE them. The global props cannot express that.
        const __rates = feeRatesFor(creatorIdOf(bill), __pageProps);
        const platformFeeRate = __rates.platform / 100;
        const complianceFeeRate = __rates.compliance / 100;
        const adminFee = adminFeeInCurrency(curr);
        const totalDeductionRate =
            stripeFeeRate + platformFeeRate + complianceFeeRate;

        if (totalDeductionRate >= 1) return priceWithVat;

        const totalSupporterPays =
            (priceWithVat + stripeFixedFee + adminFee) /
            (1 - totalDeductionRate);

        // Rounding logic to match backend (Helpers.php)
        if (!isZeroDecimal) {
            return Math.ceil(totalSupporterPays * 100) / 100;
        } else {
            return Math.ceil(totalSupporterPays);
        }
    };

    // New: Calculate estimated display price for UI only
    const getEstimatedDisplayPrice = (amount) => {
        if (
            !amount ||
            !display_currency ||
            !creator_currency ||
            display_currency === creator_currency
        )
            return null;

        // This is purely for estimation display, actual charge is in creator_currency
        return formatMultiPrice(amount, display_currency);
    };

    const finalTotalAmount = calculateTotalSupporterPays(
        bill?.price,
        bill?.currency,
        bill?.user?.vat_amount_percentage || 0,
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
    const [captchaToken, setCaptchaToken] = useState("");

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
                clientDataJSON: arrayBufferToBase64(
                    credential.response.clientDataJSON,
                ),
            },
        };

        if (credential.response.authenticatorData) {
            formatted.response.authenticatorData = arrayBufferToBase64(
                credential.response.authenticatorData,
            );
        }
        if (credential.response.signature) {
            formatted.response.signature = arrayBufferToBase64(
                credential.response.signature,
            );
        }
        if (credential.response.userHandle) {
            formatted.response.userHandle = arrayBufferToBase64(
                credential.response.userHandle,
            );
        }
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
            const userEmail =
                (typeof email !== "undefined" ? email : null) ||
                (typeof data !== "undefined" && data?.email
                    ? data.email
                    : null) ||
                auth?.user?.email;
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
        if (typeof showStepUp !== "undefined" && showStepUp) {
            checkPasskey();
        }
    }, [typeof showStepUp !== "undefined" ? showStepUp : false]);

    const handlePasskeyStepUp = async () => {
        try {
            setPasskeyLoading(true);
            const userEmail =
                (typeof email !== "undefined" ? email : null) ||
                (typeof data !== "undefined" && data?.email
                    ? data.email
                    : null) ||
                auth?.user?.email;

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
            publicKey.challenge = base64urlToUint8Array(publicKey.challenge);

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
                amount:
                    stepUpContext?.amount ||
                    Math.round(
                        finalTotalAmount *
                            (isZeroDecimalCurrency(bill?.currency) ? 1 : 100),
                    ),
                currency: stepUpContext?.currency || bill?.currency,
                creator_id:
                    stepUpContext?.creator_id ||
                    bill?.user?.uuid ||
                    bill?.user?.id,
                email: stepUpContext?.email || data.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id,
            };

            const response = await axios.post(
                "/api/risk/step-up/verify-passkey",
                payload,
            );

            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                if (typeof setSkipCaptcha !== "undefined") setSkipCaptcha(true);
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
            const response = await axios.post("/api/risk/step-up/verify", {
                otp: otpCode.trim(),
                typed_confirmation: typedConfirmation.toUpperCase().trim(),
                amount: Math.round(
                    finalTotalAmount *
                        (isZeroDecimalCurrency(bill?.currency) ? 1 : 100),
                ),
                currency: bill?.currency,
                creator_id: bill?.user?.uuid || bill?.user?.id,
                email: data.email,
                device_id: stepUpContext?.device_id || null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id,
            });

            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                setCaptchaToken("verified");
                setData("cf_turnstile_response", "verified");
                handleSubmit();
            } else {
                toast.error("Verification failed.");
            }
        } catch (error) {
            toast.error(
                error.response?.data?.error || "OTP Verification failed.",
            );
        } finally {
            setVerifyingOtp(false);
        }
    };

    const onVerify = useCallback((token) => {
        setCaptchaToken(token || "");
    }, []);

    useEffect(() => {
        setData("cf_turnstile_response", captchaToken || "");
    }, [captchaToken, setData]);

    // Server redirect-back-with-error must actually reach the buyer. The old code
    // only read props.flash inside onSuccess — a STALE closure that never saw the
    // fresh flash, so a refused checkout rendered with no message at all.
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

    const handleSubmit = () => {
        // Re-entrancy guard: a second tap before the disabled re-render must not
        // fire a second checkout session.
        if (checking) return;
        if (turnstileSiteKey && !data.cf_turnstile_response) {
            errorAlert("Please verify the captcha");
            return;
        }
        setChecking(true);
        post(
            route(`bill.checkout`, {
                uuid: bill.uuid,
            }),
            {
                preserveScroll: true,
                onError: (errorBag) => {
                    // errorBag is an object — passing it whole rendered "[object Object]".
                    const first =
                        errorBag && Object.values(errorBag).flat()[0];
                    errorAlert(first ? String(first) : "Checkout failed.");
                    setCaptchaToken("");
                    if (turnstileRef.current) {
                        turnstileRef.current.reset();
                    }
                },
                onFinish: () => {
                    // cleanup, stop loader, etc.
                    setChecking(false);
                },
            },
        );
    };

    // A bill can be weekly / monthly / yearly — hardcoded "monthly" copy told a
    // weekly supporter the wrong charge cadence at the moment they pay.
    const periodKey = (bill?.period || "monthly").toLowerCase();
    const periodLabel = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly", annual: "Yearly" }[periodKey] || "Recurring";
    const periodAdverb = { weekly: "weekly", monthly: "monthly", yearly: "yearly", annual: "yearly" }[periodKey] || "on schedule";

    return (
        <>
            <Authenticated auth={auth.user} user={user}>
                <Head title={`Join - content membership`} />
                <div className="py-6 md:py-12 px-4 bg-white">
                    <div className="max-w-[1040px] mx-auto">
                        <div className="mb-6 md:mb-8">
                            <h1 className="font-black uppercase tracking-tight text-2xl md:text-3xl leading-none">
                                Complete your membership
                            </h1>
                            <p className="text-sm font-bold text-black/60 mt-2">
                                {periodLabel} content membership from{" "}
                                {bill?.user?.name || ""}{" "}
                                <Link
                                    className="text-[#FF007F] hover:underline"
                                    target="_blank"
                                    href={`/${bill?.user?.username || ""}`}
                                >
                                    @{bill?.user?.username || ""}
                                </Link>{" "}
                                — at least 3 member posts every month.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-10 items-start">
                            <div className="min-w-0">
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <ul className="flex flex-wrap">
                                        <li className="w-full">
                                            <SectionLabel>
                                                Message for the creator
                                            </SectionLabel>
                                            <textarea
                                                rows={3}
                                                className={fieldClass}
                                                onChange={(e) =>
                                                    setData(
                                                        "message",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Write message in under 800 Words..."
                                                value={data.message}
                                            ></textarea>
                                            <span className="text-xs text-red-600">
                                                {errors.message}
                                            </span>
                                        </li>
                                        <li className="w-full mt-3">
                                            <div className="flex flex-wrap">
                                                <div className="w-full mb-4">
                                                    <SectionLabel>
                                                        Your details
                                                    </SectionLabel>
                                                    <label className="text-xs font-bold text-black/60 block mb-1">
                                                        From
                                                    </label>
                                                    <input
                                                        className={fieldClass}
                                                        onChange={(e) =>
                                                            setData(
                                                                "name",
                                                                e.target.value,
                                                            )
                                                        }
                                                        value={data.name}
                                                        type="text"
                                                        placeholder="Enter Your Name..."
                                                    />
                                                    <span className="text-xs text-red-600">
                                                        {errors.name}
                                                    </span>
                                                </div>
                                                <div className="w-full mb-4">
                                                    <label className="text-xs font-bold text-black/60 block mb-1">
                                                        Email{" "}
                                                        <span className="text-black/60 font-bold normal-case">
                                                            — stays private
                                                        </span>
                                                    </label>
                                                    <input
                                                        className={`${
                                                            auth &&
                                                            auth.user &&
                                                            auth.user.email
                                                                ? "opacity-60 cursor-not-allowed"
                                                                : ""
                                                        } ${fieldClass}`}
                                                        value={data.email}
                                                        disabled={
                                                            auth &&
                                                            auth.user &&
                                                            auth.user.email
                                                                ? true
                                                                : false
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "email",
                                                                e.target.value,
                                                            )
                                                        }
                                                        type="email"
                                                        placeholder="Enter Your Email..."
                                                    />
                                                    <span className="text-xs text-red-600">
                                                        {errors.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="cheklistbox">
                                            <label
                                                htmlFor="anonymous"
                                                className="text-left flex items-center"
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
                                            <p className="text-black/60 text-sm mb-3">
                                                Your personal email and name
                                                will be private.
                                            </p>
                                            <CheckoutLegalTerms
                                                onAgreeChange={(checked) => {
                                                    setData("agree", checked);
                                                    setData(
                                                        "digital_waiver",
                                                        checked,
                                                    );
                                                }}
                                            />
                                        </li>
                                    </ul>

                                    {!card_capabilities && (
                                        <div
                                            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4"
                                            role="alert"
                                        >
                                            <strong className="font-bold">
                                                Payment Unavailable:{" "}
                                            </strong>
                                            <span className="block sm:inline">
                                                This creator cannot receive
                                                payments yet.
                                            </span>
                                        </div>
                                    )}
                                    {turnstileSiteKey ? (
                                        <div className="mt-4 flex items-center justify-center">
                                            <Turnstile
                                                ref={turnstileRef}
                                                size="normal"
                                                theme="light"
                                                onVerify={onVerify}
                                            />
                                        </div>
                                    ) : null}
                                </form>
                            </div>

                            <div className="lg:sticky lg:top-24">
                                <SummaryReceipt
                                    image={bill.perma_link || uploadedimg}
                                    typeBadge="Membership"
                                    itemTitle="Content membership"
                                    itemSub={bill.name}
                                    payingLabel="You're subscribing to"
                                    creatorName={bill?.user?.name}
                                    creatorUsername={bill?.user?.username}
                                    creatorAvatar={bill?.user?.avatar_url}
                                    whatYouGet={[
                                        ...rewardLines(bill),
                                        `${periodLabel} access to this creator's members-only content`,
                                        "New posts delivered while your membership is active",
                                        "Cancel anytime — access stays until the period ends",
                                    ]}
                                    rows={[
                                        {
                                            label: `${periodLabel} membership`,
                                            value: formatMultiPrice(
                                                finalTotalAmount,
                                                bill && bill.currency,
                                            ),
                                        },
                                    ]}
                                    total={formatMultiPrice(
                                        finalTotalAmount,
                                        bill && bill?.currency,
                                    )}
                                    totalNote={`Includes all fees. You'll be charged in ${bill?.currency}.`}
                                    nextStep={`Your membership starts right away and renews ${periodAdverb} until you cancel.`}
                                    renewalNote={`Renews ${periodAdverb} · cancel anytime`}
                                >
                                    <PayButton
                                        label={`Subscribe & pay ${formatMultiPrice(
                                            finalTotalAmount,
                                            bill && bill?.currency,
                                        )}`}
                                        processing={processing || checking}
                                        disabled={
                                            !data.agree ||
                                            !data.digital_waiver ||
                                            !card_capabilities
                                        }
                                        onClick={handleSubmit}
                                    />
                                    {(!data.agree || !data.digital_waiver) && (
                                        <p className="text-[12px] font-bold text-black/60 text-center mt-2">
                                            Accept the terms above to
                                            continue.
                                        </p>
                                    )}
                                </SummaryReceipt>
                            </div>
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
                        <h2 className="text-xl font-bold mb-2 text-center">
                            {stepUpData?.ui?.title || "Confirm Your Payment"}
                        </h2>
                        <p className="text-black/60 mb-6 text-center">
                            {stepUpData?.ui?.body ||
                                "For your security, please confirm this payment."}
                        </p>
                        <form onSubmit={handleVerifyStepUp}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-black/80 mb-1">
                                    Enter OTP Code (Check your email)
                                </label>
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
                                <label className="block text-sm font-medium text-black/80 mb-1">
                                    Type 'CONFIRM' to proceed
                                </label>
                                <input
                                    type="text"
                                    className={fieldClass}
                                    placeholder="CONFIRM"
                                    value={typedConfirmation}
                                    onChange={(e) =>
                                        setTypedConfirmation(e.target.value)
                                    }
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
                                    disabled={
                                        verifyingOtp ||
                                        !otpCode ||
                                        typedConfirmation.toUpperCase() !==
                                            "CONFIRM"
                                    }
                                    className={`w-full main-button p ${!otpCode || typedConfirmation.toUpperCase() !== "CONFIRM" || verifyingOtp ? "disabled" : ""}`}
                                >
                                    {verifyingOtp
                                        ? "Verifying..."
                                        : "Verify & Checkout"}
                                </button>
                            </div>
                        </form>

                        {isWebAuthnSupported() && hasPasskey && (
                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <button
                                    type="button"
                                    onClick={handlePasskeyStepUp}
                                    disabled={
                                        passkeyLoading ||
                                        (typeof verifyingOtp !== "undefined"
                                            ? verifyingOtp
                                            : false)
                                    }
                                    className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-black/60 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                                >
                                    {passkeyLoading ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#FF007F]"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Checking device...
                                        </>
                                    ) : (
                                        "Use Face ID / Fingerprint"
                                    )}
                                </button>
                                <p className="text-xs text-black/60 text-center mt-2">
                                    Bypass OTP by verifying your identity with a
                                    saved passkey.
                                </p>
                            </div>
                        )}
                    </div>
                </Popup>
            </Authenticated>
        </>
    );
}
