import { useAlerts } from "@/Components/Alerts";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useForm, Head } from "@inertiajs/react";
import { useState } from "react";

export default function MorConsent(props) {
    const { auth, user } = props;
    const { errorAlert } = useAlerts();
    const { data, setData, post, processing, errors } = useForm({
        mor_agreed: false,
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

    const finalStepsUnlocked = auth?.user?.profile_status_lock == 2;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.mor_agreed) {
            errorAlert(
                "Please check the confirmation box to agree to the Merchant of Record terms.",
            );
            return;
        }

        post(route("stripe.mor-consent.store"));
    };

    return (
        <Authenticated auth={auth.user} user={user}>
            <Head title="Merchant of Record Consent - Spenny Piggy" />
            <div className="bg-white min-h-dvh py-12 md:py-20">
                <div className="containerbox mx-auto px-4">
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-[29px] uppercase text-pink mb-2">
                            Merchant of Record Acknowledgement
                        </h1>
                        <p className="text-black text-lg font-CeraGR max-w-2xl mx-auto">
                            Important agreement required before connecting your
                            payment account
                        </p>
                    </div>

                    {/* Gating Banner */}
                    {!finalStepsUnlocked && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-box-sm text-yellow-800">
                            <p className="font-semibold">
                                Admin Profile Approval Required
                            </p>
                            <p className="text-sm">
                                Complete your basic profile and submit for admin
                                approval to access payment setup.
                            </p>
                        </div>
                    )}

                    {/* Merchant of Record Agreement Card */}
                    <div className="bg-white rounded-box border border-gray-200 overflow-hidden mb-8">
                        <div className="p-5 sm:p-8">
                            {/* Agreement Header */}
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">📝</span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 font-GillSans uppercase mb-2">
                                    Merchant of Record Agreement
                                </h2>
                                <p className="text-lg text-pink font-semibold">
                                    Oink! @{auth?.user?.username}
                                </p>
                            </div>

                            {/* Agreement Content */}
                            <div className="space-y-6 mb-8">
                                <div className="bg-pink-50/50 rounded-box-sm p-5 sm:p-8 border border-pink-100">
                                    <p className="text-gray-900 text-lg text-center font-bold leading-relaxed">
                                        I confirm that I understand and agree
                                        that I am the Merchant of Record (MoR)
                                        for all payments made by supporters to
                                        me through Spenny Piggy.
                                    </p>
                                </div>

                                {/* Agreement Points */}
                                <div className="space-y-6 px-2">
                                    <h3 className="text-sm font-bold text-[#FF007F] uppercase tracking-widest text-center">
                                        I Acknowledge and Agree That:
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {acknowledgements.map((text, index) => (
                                            <div key={index} className="flex items-start gap-4 p-4 rounded-box-sm bg-gray-50/50 border border-gray-100 hover:border-pink-200 transition-colors">
                                                <div className="w-6 h-6 bg-[#FF007F] text-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ">
                                                    <span className="text-[12px] font-bold">✓</span>
                                                </div>
                                                <p className="text-black/80 leading-relaxed font-medium">
                                                    {text}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-gray-900 rounded-box-sm p-5 sm:p-6 ">
                                    <p className="text-white text-center font-bold text-sm leading-relaxed italic">
                                        "By continuing, I confirm that I have
                                        read, understood, and agree to this
                                        Merchant of Record arrangement and acknowledge my legal responsibility."
                                    </p>
                                </div>
                            </div>

                            {/* Confirmation Checkbox */}
                            <div className="bg-gray-50 rounded-box-sm p-5 sm:p-6 mb-8">
                                <label
                                    htmlFor="mor_agreement"
                                    className="flex items-start gap-3 cursor-pointer"
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
                                        className="mt-1 w-6 h-6 shrink-0 accent-[#FF007F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF007F]"
                                    />
                                    <p className="text-lg font-semibold text-gray-800 leading-relaxed">
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
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="block w-full text-center bg-[#FF007F] hover:brightness-110 text-black font-gulfs uppercase text-lg min-h-[48px] py-3 px-6 rounded-box-sm transition-colors duration-200 active:brightness-95 flex-1 max-w-md mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!data.mor_agreed || processing}
                                >
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
                                <p className="text-sm text-black/60">
                                    You must agree to these terms before you can
                                    connect your Stripe account and receive
                                    payments.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 text-center">
                        {/* was bg-white/10 on a white page — an invisible surface */}
                        <div className="inline-flex items-center gap-2 bg-black/[0.04] rounded-full px-6 py-3">
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
