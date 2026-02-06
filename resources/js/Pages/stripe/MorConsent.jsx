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
            <div className="bg-white min-h-screen py-12 md:py-20">
                <div className="max-width-800 mx-auto px-4">
                    {/* Header Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-[29px] font-gulfs uppercase text-pink mb-2">
                            Merchant of Record Acknowledgement
                        </h1>
                        <p className="text-black text-lg font-CeraGR max-w-2xl mx-auto">
                            Important agreement required before connecting your
                            payment account
                        </p>
                    </div>

                    {/* Gating Banner */}
                    {!finalStepsUnlocked && (
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg text-yellow-800">
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
                    <div className="bg-white rounded-xl  shadow-lg border border-gray-200 overflow-hidden mb-8">
                        <div className="p-8">
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
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                                    <p className="text-gray-700 text-lg text-center font-semibold">
                                        I confirm that I understand and agree
                                        that I am the Merchant of Record (MoR)
                                        for all payments made by supporters to
                                        me through Spenny Piggy.
                                    </p>
                                </div>

                                {/* Agreement Points */}
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-pink text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                What this means:
                                            </h3>
                                            <ul className="text-gray-600 space-y-1 pl-5 list-disc">
                                                <li>
                                                    I am the seller of my
                                                    content, services, or
                                                    digital goods
                                                </li>
                                                <li>
                                                    Payments are made to me via
                                                    my connected Stripe account
                                                </li>
                                                <li>
                                                    I am responsible for
                                                    fulfilment of supporter
                                                    purchases
                                                </li>
                                                <li>
                                                    I am responsible for
                                                    refunds, disputes,
                                                    chargebacks, and applicable
                                                    taxes
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-pink text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                Platform Role:
                                            </h3>
                                            <p className="text-gray-600">
                                                I understand that Spenny Piggy
                                                acts solely as a technology
                                                platform and payment
                                                facilitator, and is not the
                                                seller of my content or
                                                services.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-pink text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                Disputes & Chargebacks:
                                            </h3>
                                            <ul className="text-gray-600 space-y-1 pl-5 list-disc">
                                                <li>
                                                    Spenny Piggy may assist with
                                                    disputes and chargebacks by
                                                    providing platform records
                                                    such as logs, timestamps,
                                                    messages, and transaction
                                                    data where available
                                                </li>
                                                <li>
                                                    Final responsibility and
                                                    outcomes for disputes and
                                                    chargebacks remain with me
                                                    as the Merchant of Record
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-pink text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                Compliance Requirements:
                                            </h3>
                                            <p className="text-gray-600">
                                                I understand that Spenny Piggy
                                                enforces content and platform
                                                requirements designed to meet
                                                payment processor (including
                                                Stripe) compliance standards.
                                                Failure to meet these
                                                requirements may result in
                                                restrictions, removal of
                                                content, or suspension of
                                                account access.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-pink text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                Tax Responsibilities:
                                            </h3>
                                            <p className="text-gray-600">
                                                Spenny Piggy can provide
                                                transaction records and payout
                                                documentation to support my tax
                                                reporting obligations. I remain
                                                solely responsible for
                                                determining, reporting, and
                                                paying any applicable taxes.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-pink text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                            ✓
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-1">
                                                Payment Descriptors:
                                            </h3>
                                            <p className="text-gray-600">
                                                I acknowledge that supporter
                                                bank or card statements may
                                                display "Spenny Piggy" and/or
                                                "Stripe" as the payment
                                                descriptor, even though I am the
                                                Merchant of Record.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-mint/20 rounded-xl p-6">
                                    <p className="text-gray-700 text-center font-semibold">
                                        By continuing, I confirm that I have
                                        read, understood, and agree to this
                                        Merchant of Record arrangement.
                                    </p>
                                </div>
                            </div>

                            {/* Confirmation Checkbox */}
                            <div className="bg-gray-50 rounded-xl p-6 mb-8">
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
                                    className="btn-pink sm flex-1 max-w-md mx-auto disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-voilet transition-all duration-300"
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
                                <p className="text-sm text-gray-500">
                                    You must agree to these terms before you can
                                    connect your Stripe account and receive
                                    payments.
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
