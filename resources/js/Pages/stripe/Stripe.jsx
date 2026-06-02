import { useAlerts } from "@/Components/Alerts";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Countries from "@/includes/Countries";
import { useForm, Head } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { useRef } from "react";
import Popup from "@/Components/Popup";

export default function Stripe(props) {
    const { auth, user, success, mor_consent_given, mor_consent_details } =
        props;
    const checkRef = useRef();
    const creatorEmailReceiptAckRef = useRef();
    const { errorAlert, successAlert } = useAlerts();
    const { data, setData, post, processing, errors } = useForm({
        termaccept: "",
        mor_agreed: false,
        creator_email_receipt_ack: false,
    });

    const acknowledgements = [
        "I am the seller of my content, services, and any Creator Content made available through my profile or storefront.",
        "All payments made by supporters are made directly to me via my connected Stripe account, and I am solely responsible for the fulfilment, delivery, and quality of all Creator Content.",
        "I am responsible for handling refunds, disputes, chargebacks, complaints, and any claims arising from transactions with supporters, subject to the Platform’s rights and payment processor requirements.",
        "I am responsible for determining, reporting, and paying any applicable taxes in my jurisdiction, including income tax, VAT, sales tax, or any other applicable taxes.",
        "Spenny Piggy provides payment routing, processing infrastructure, moderation systems, and risk management controls only, and does not act as the seller, merchant, or supplier of any goods or services.",
        "Spenny Piggy may, at its sole discretion, intervene in transactions, including delaying payouts, applying reserves, withholding funds, reversing transactions, or issuing refunds where required for compliance, fraud prevention, dispute resolution, or risk management purposes.",
        "All funds are subject to processing, verification, and risk controls and are not guaranteed until successfully paid out in accordance with Platform policies and payment processor requirements.",
        "I agree to comply with all Platform Terms, Payment Processor requirements (including Stripe), and applicable laws in connection with my use of the Platform."
    ];

    const [countryCurrency, setCountryCurrency] = useState();
    const [country, setCountry] = useState("");
    const [connecting, setConnecting] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const adminIdentityApproved = auth?.user?.identity_admin_status === 1;
    const finalStepsUnlocked = auth?.user?.profile_status_lock == 2;
    const creatorEmailReceiptAcked = !!auth?.user
        ?.creator_email_receipt_acknowledged_at;

    // Show success message if redirected after consent AND scroll to top
    useEffect(() => {
        if (success) {
            successAlert(success);
            // Scroll to top when success message is shown
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [success]);

    // Only show consent details if consent was given before this session
    // Don't show if we just submitted the form (success message will handle that)
    const showConsentDetails = mor_consent_details && !success;

    const getCountry = (e) => {
        if (e == "") {
            setCountry("");
        } else {
            const name = JSON.parse(e);
            setCountry((name && name.code) || "");
            setCountryCurrency((name && name.currency) || "");
        }
    };

    const handleMorConsent = () => {
        if (!data.mor_agreed) {
            errorAlert(
                "Please check the confirmation box to agree to the Merchant of Record terms.",
            );
            return;
        }

        post(route("stripe.mor-consent.store"), {
            preserveScroll: true,
            onSuccess: () => {
                // The page will reload with updated props
                // No need to manually update state here
                // The success prop will be set and useEffect will handle scrolling
            },
            onError: (errors) => {
                if (errors.message) {
                    errorAlert(errors.message);
                } else {
                    errorAlert(
                        "Failed to confirm agreement. Please try again.",
                    );
                }
            },
        });
    };

    const checkTerms = () => {
        if (country == "") {
            errorAlert("Please choose your country.");
            return false;
        }
        if (!finalStepsUnlocked) {
            errorAlert(
                "Complete admin profile approval before connecting Stripe.",
            );
            return false;
        }
        if (!mor_consent_given) {
            errorAlert("You must agree to the Merchant of Record terms first.");
            return false;
        }

        if (
            !creatorEmailReceiptAcked &&
            creatorEmailReceiptAckRef &&
            creatorEmailReceiptAckRef.current &&
            !creatorEmailReceiptAckRef.current.checked
        ) {
            errorAlert(
                "Please confirm you understand your creator e-mail address may appear on supporter transaction records and receipts.",
            );
            creatorEmailReceiptAckRef.current.focus();
            return false;
        }

        // if (!checkRef.current.checked) {
        //     errorAlert("Please check accept terms & conditions checkbox");
        //     checkRef.current.focus();
        //     return false;
        // }

        setConnecting(true);

        post(
            route("stripe.connect", {
                country: country,
                currency: countryCurrency,
            }),
            {
                preserveScroll: true,
                onError: (errs) => {
                    setConnecting(false);
                    Object.keys(errs || {}).forEach((k) => {
                        if (errs[k]) errorAlert(errs[k]);
                    });
                },
            },
        );
        return true;
    };

    const handlePopupAction = (closeFunction) => {
        // If there's a close function from Popup, use it
        if (typeof closeFunction === "function") {
            closeFunction();
        }
        // Also update our local state
        setIsPopupOpen(false);
    };

    const handlePopupOpen = () => {
        setIsPopupOpen(true);
    };

    // Agar MoR consent database mein nahi hai, to consent form dikhao
    if (!mor_consent_given) {
        return (
            <Authenticated auth={auth.user} user={user}>
                <Head title="Merchant of Record Consent - Spenny Piggy" />
                <div className="bg-white min-h-screen py-12 md:py-20">
                    <div className="containerbox mx-auto px-4">
                        <div className="text-center mb-10"> 
                            <h1 className="text-[25px] font-bold font-CeraGR  uppercase text-pink mb-2">
                                Merchant of Record Acknowledgement
                            </h1>
                            <p className="text-black text-lg font-CeraGR max-w-2xl mx-auto">
                                Important agreement required before connecting
                                your payment account
                            </p>
                        </div>

                        {/* Show success message if consent was just submitted */}
                        {success && (
                            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl text-green-800 animate-fade-in">
                                <div className="flex items-center">
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div>
                                        <p className="font-semibold">
                                            Merchant of Record Agreement
                                            Confirmed
                                        </p>
                                        <p className="text-sm">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Show consent details ONLY if consent was given previously (not just now) */}
                        {showConsentDetails && (
                            <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl text-blue-800">
                                <div className="flex items-center">
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <div>
                                        <p className="font-semibold">
                                            Merchant of Record Consent Found
                                        </p>
                                        <p className="text-sm">
                                            Consent given on:{" "}
                                            {mor_consent_details.given_at}
                                            {mor_consent_details.location && ` from ${mor_consent_details.location}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gating Banner */}
                        {!finalStepsUnlocked && (
                            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl text-yellow-800">
                                <p className="font-semibold">
                                    Admin Profile Approval Required
                                </p>
                                <p className="text-sm">
                                    Complete your basic profile and submit for
                                    admin approval to unlock payment setup.
                                </p>
                            </div>
                        )}

                        {/* Merchant of Record Agreement Card */}
                        <div className="bg-white rounded-[30px]    shadow-lg border border-gray-200 overflow-hidden mb-8">
                            <div className="p-8">
                                {/* Agreement Header */}
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-3xl">📝</span>
                                    </div>
                                    <p className="text-xl text-gray-800 font-bold uppercase mb-2">
                                        Merchant of Record Agreement
                                    </p>
                                    <p className="text-lg text-pink font-semibold">
                                        Oink! @{auth?.user?.username}
                                    </p>
                                </div>

                                {/* Agreement Content */}
                                <div className="space-y-6 mb-8">
                                    <div className="bg-pink-50/50 rounded-[30px]  p-8 border border-pink-100">
                                        <p className="text-gray-900 text-lg text-center font-bold leading-relaxed">
                                            I confirm that I understand and
                                            agree that I am the Merchant of
                                            Record (MoR) for all payments made
                                            by supporters to me through Spenny
                                            Piggy.
                                        </p>
                                    </div>

                                    {/* Agreement Points */}
                                    <div className="space-y-6 px-2">
                                        <h3 className="text-sm font-bold text-[#FF007F] uppercase tracking-widest text-center">
                                            I Acknowledge and Agree That:
                                        </h3>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {acknowledgements.map((text, index) => (
                                                <div key={index} className="flex items-start gap-4 p-4 rounded-[30px]  bg-gray-50/50 border border-gray-100 hover:border-pink-200 transition-colors">
                                                    <div className="w-6 h-6 bg-[#FF007F] text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                                        <span className="text-[10px] font-bold">✓</span>
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed font-medium">
                                                        {text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 rounded-[30px]  p-6 shadow-[4px_4px_0px_0px_#FF007F]l">
                                        <p className="text-white text-center font-bold text-sm leading-relaxed italic">
                                            "By continuing, I confirm that I have
                                            read, understood, and agree to this
                                            Merchant of Record arrangement and acknowledge my legal responsibility."
                                        </p>
                                    </div>
                                </div>

                                {/* Confirmation Checkbox */}
                                <div className="mb-8">
                                    <label
                                        htmlFor="mor_agreement"
                                        className="flex items-start space-x-3 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            id="mor_agreement"
                                            name="mor_agreement"
                                            checked={data.mor_agreed}
                                            onChange={(e) =>
                                                setData(
                                                    "mor_agreed",
                                                    e.target.checked,
                                                )
                                            }
                                            className="mt-1 w-5 h-5 text-pink border-2 border-gray-300 rounded focus:ring-pink focus:ring-2"
                                        />
                                        <p className="text-md font-semibold text-gray-800 leading-relaxed">
                                            ✅ I confirm and agree to be the
                                            Merchant of Record for all my
                                            transactions
                                        </p>
                                    </label>
                                    {errors.mor_agreed && (
                                        <p className="text-red-500 text-sm mt-2">
                                            {errors.mor_agreed}
                                        </p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button className="block w-full text-center bg-[#FF007F] hover:bg-pink-600 text-white uppercase text-md py-3 px-6 rounded-full transition-all duration-200 btn-shadow active:transform active:scale-[0.99] flex-1 max-w-md mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={handleMorConsent} disabled={!data.mor_agreed || processing } >
                                        {processing ? (
                                            <span className="flex items-center justify-center">
                                                <svg
                                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                                Confirming...
                                            </span>
                                        ) : (
                                            "CONFIRM & CONTINUE TO STRIPE SETUP"
                                        )}
                                    </button>
                                </div>

                                {/* Note */}
                                <div className="mt-6 text-center">
                                    <p className="text-sm text-gray-500">
                                        You must agree to these terms before you
                                        can connect your Stripe account and
                                        receive payments.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="mt-8 text-center">
                            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-6 py-3">
                                <svg
                                    className="w-5 h-5 text-mint"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                                <span className="text-black text-sm">
                                    Secured by Stripe - Industry-leading payment
                                    security
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Authenticated>
        );
    }

    // Agar MoR consent database mein hai, to directly Stripe setup page dikhao
    return (
        <Authenticated auth={auth.user} user={user}>
            <Head title="Connect Stripe Account - Spenny Piggy" />
            <div className="bg-white min-h-screen py-12 md:py-20">
                <div className="containerbox mx-auto px-4">
                    {/* Header Section */}
                    <div className="text-center mb-2">
                        <h1 className="text-[29px] font-gulfs uppercase text-pink mb-1">
                            Connect Your Stripe Account
                        </h1>
                        <p className="text-black text-lg font-CeraGR max-w-2xl mx-auto mb-4 ">
                            Set up secure payments to start receiving gifts and
                            donations from your fans
                        </p>
                    </div>

                    {/* Show success message if consent was just submitted */}
                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-500 p-4 rounded-xl text-green-800 animate-fade-in">
                            <div className="flex items-center">
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <p className="font-semibold">
                                        Merchant of Record Agreement Confirmed
                                    </p>
                                    <p className="text-sm">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show consent details ONLY if consent was given previously (not just now) */}
                    {showConsentDetails && (
                        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl text-blue-800">
                            <div className="flex items-center">
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <p className="font-semibold">
                                        Merchant of Record Consent Verified
                                    </p>
                                    <p className="text-sm">
                                        Consent given on:{" "}
                                        {mor_consent_details.given_at}
                                        {mor_consent_details.location &&
                                            ` from ${mor_consent_details.location}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gating Banner */}
                    {!finalStepsUnlocked && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl text-yellow-800">
                            <p className="font-semibold">Admin Profile Approval Required</p>
                            <p className="text-sm">Complete your basic profile and submit for admin approval to access payment setup.</p>
                        </div>
                    )}

                    {/* Main Content Card */}
                    <div className="whbg rounded-[30px]   overflow-hidden">
                        <div className="">
                            <div className="mb-8">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-[30px]    p-6 mb-6">
                                    <p className="text-gray-700 leading-relaxed">
                                        <strong className="text-voilet">
                                            Stripe supports adult creators
                                        </strong>{" "}
                                        using Spenny Piggy to process gifts
                                        within our terms of service. If Stripe
                                        attempts to restrict your account,
                                        contact our support team for assistance.
                                        Please ensure none of the following
                                        prohibited items are listed:
                                    </p>
                                </div>

                                {/* Prohibited Items Grid */}
                                <div className="grid md:grid-cols-1 gap-1 mb-8">
                                    {[
                                        {
                                            icon: "🛍️",
                                            title: "Selling goods or services",
                                            subtitle: "on your wishlist",
                                        },
                                        {
                                            icon: "🤝",
                                            title: "Promising goods or services",
                                            subtitle: "in exchange for gifts",
                                        },
                                        {
                                            icon: "🖼️",
                                            title: "Gifts with nudity",
                                            subtitle: "in the item image",
                                        },
                                        {
                                            icon: "🚬",
                                            title: "Alcohol, Tobacco & THC items",
                                            subtitle: "Prohibited substances",
                                        },
                                        {
                                            icon: "🔞",
                                            title: "Explicit Adult Toys",
                                            subtitle:
                                                "Sensual wellness products are acceptable",
                                        },
                                        {
                                            icon: "💰",
                                            title: "Service-related words",
                                            subtitle:
                                                "tax, fee, session, deposit, unblock",
                                        },
                                        {
                                            icon: "👑",
                                            title: "Word 'Tribute'",
                                            subtitle:
                                                "Use 'Appreciation' or 'Tip' instead",
                                        },
                                    ].map((item, index) => (
                                        <div
                                            key={index}
                                            className="bg-white border-2 border-red-100 rounded-[30px]   p-3 hover:border-red-200 transition-colors"
                                        >
                                            <div className="flex items-center  gap-2">
                                                <span className="text-2xl">
                                                    {item.icon}
                                                </span>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800 mb-1">
                                                        ❌ {item.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {item.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Country Selection */}
                            <div className="mb-2">
                                <div className="p-2">
                                    <h3 className="text-normal text-start font-bold text-gray-800 mb-2 capitalize">
                                        Select Your Country
                                    </h3>
                                    <div className="max-w-full m-auto">
                                        <Countries send={getCountry} />
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                        
                    <div className="bg-gray-50 rounded-[30px]   p-6 mb-6">
                        <div className="mb-4 bg-white border border-gray-200 rounded-[20px] p-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                The e-mail address used for your creator
                                account may appear on supporter receipts,
                                payment confirmations, and transaction records.
                                Please ensure you are using an e-mail address
                                that you are comfortable sharing with
                                supporters. If you do not wish to share a
                                personal e-mail address, we recommend creating
                                a dedicated creator/business e-mail for your
                                account.
                            </p>
                        </div>

                        <label
                            htmlFor="creator_email_receipt_ack"
                            className={`flex items-start space-x-3 cursor-pointer ${
                                creatorEmailReceiptAcked
                                    ? "opacity-70"
                                    : ""
                            }`}
                        >
                            <input
                                type="checkbox"
                                ref={creatorEmailReceiptAckRef}
                                id="creator_email_receipt_ack"
                                name="creator_email_receipt_ack"
                                checked={
                                    creatorEmailReceiptAcked ||
                                    !!data.creator_email_receipt_ack
                                }
                                disabled={creatorEmailReceiptAcked}
                                onChange={(e) =>
                                    setData(
                                        "creator_email_receipt_ack",
                                        e.target.checked,
                                    )
                                }
                                className="mt-1 w-5 h-5 text-pink border-2 border-gray-300 rounded focus:ring-pink focus:ring-2 disabled:cursor-not-allowed"
                            />
                            <p className="text-sm text-gray-700 leading-relaxed">
                                I understand my creator e-mail address may
                                appear on supporter transaction records and
                                receipts.
                            </p>
                        </label>

                        <label
                            htmlFor="termaccept"
                            className="flex items-start space-x-3 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                ref={checkRef}
                                id="termaccept"
                                name="termaccept"
                                value="termaccept"
                                required
                                onChange={(e) =>
                                    setData(
                                        "termaccept",
                                        e.target.value,
                                    )
                                }
                                className="mt-1 w-5 h-5 text-pink border-2 border-gray-300 rounded focus:ring-pink focus:ring-2"
                            />
                            <p className="text-sm text-gray-700 leading-relaxed">
                                I confirm I will only use
                                Spenny Piggy in line with
                                the Terms of Service and
                                understand my account could
                                be suspended for repeated
                                violations. I also confirm
                                that I will create and post
                                exclusive content in
                                exchange for receiving
                                gifts, donations,
                                subscriptions, memberships
                                and bill payments. I also
                                confirm that nothing on the
                                above prohibited list will
                                be added to my profile.
                            </p>
                        </label>
                    </div>

                    <div className="flex justify-center">
                        <button
                            className={`${!country || (checkRef && checkRef.current && !checkRef.current.checked) ? "opacity-50 cursor-not-allowed" : ""} block w-full text-center bg-[#FF007F] hover:bg-pink-600 text-white font-gulfs uppercase text-lg py-3 px-6 rounded-full transition-all duration-200 btn-shadow active:transform active:scale-[0.99] transition-all duration-300 transform hover:scale-105`}
                            onClick={checkTerms}
                            disabled={
                                connecting ||
                                !finalStepsUnlocked ||
                                !mor_consent_given ||
                                !country ||
                                (checkRef && checkRef.current && !checkRef.current.checked) ||
                                (!creatorEmailReceiptAcked &&
                                    creatorEmailReceiptAckRef &&
                                    creatorEmailReceiptAckRef.current &&
                                    !creatorEmailReceiptAckRef.current.checked)
                            }
                        >
                            {connecting ? (
                                <span className="flex items-center justify-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                                    Connecting to Stripe...
                                </span>
                            ) : (
                                "Connect to Stripe"
                            )}
                        </button>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-6 py-3">
                            <svg
                                className="w-5 h-5 text-mint"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            <span className="text-black text-sm">
                                Secured by Stripe - Industry-leading payment
                                security
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
