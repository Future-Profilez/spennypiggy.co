import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";
import { HiCheckCircle } from "react-icons/hi";

export default function MorAgreement(props) {
    const { auth, user } = props;
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

    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Merchant of Record Agreement" />
            <LegalLayout activePage="MorAgreement">
                <div className="mx-auto p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-black text-pink-600 mb-8 uppercase tracking-tighter">
                        Merchant of Record Agreement
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-8 mb-4">SPENNY PIGGY</h2>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-8 mb-4">MERCHANT OF RECORD CONFIRMATION</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed italic">Stripe Connect Onboarding — Creator Acknowledgement</p>
                        <p className="mb-4 text-gray-700 leading-relaxed text-sm text-gray-500 italic">Issue Date: 23 April 2026</p>
                        <p className="mb-6 text-gray-700 leading-relaxed">As part of your Stripe Connect onboarding, you are required to read and confirm the following Merchant of Record declaration. Please review each point to confirm your understanding and acceptance before proceeding.</p>
                        
                        <div className="bg-pink-50/50 rounded-2xl p-6 md:p-8 mb-8 border border-pink-100">
                            <p className="text-lg text-gray-900 mb-6 flex items-center gap-2">
                                <HiCheckCircle className="text-pink-600 text-xl" />
                                Merchant of Record Confirmation
                            </p>
                            <p className="mb-6 text-gray-800">I confirm that I understand and agree that I am the Merchant of Record (“MoR”) for all payments made by supporters to me through Spenny Piggy.</p>
                            
                            <p className="text-sm text-pink-600 uppercase tracking-wider mb-4">I Acknowledge and Agree That:</p>
                            <ul className="space-y-4 list-none pl-0">
                                {acknowledgements.map((text, index) => (
                                    <li key={index} className="flex items-start gap-3 text-gray-700 leading-relaxed">
                                        <div className="mt-1 flex-shrink-0">
                                            <HiCheckCircle className="text-pink-400 text-lg" />
                                        </div>
                                        <span>{text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-8 border border-gray-100">
                            <p className="text-lg text-gray-900 mb-4">Final Acceptance</p>
                            <div className="flex items-start gap-3 text-gray-800">
                                <div className="mt-1 flex-shrink-0">
                                    <HiCheckCircle className="text-pink-600 text-lg" />
                                </div>
                                <p>By continuing, I confirm that I have read, understood, and agree to this Merchant of Record arrangement and acknowledge that I am legally responsible for all transactions conducted through my account.</p>
                            </div>
                        </div>


                        <p className="mt-12 text-sm text-gray-500">This document forms part of the Spenny Piggy Platform Legal Framework.</p>
                        <p className="text-sm text-gray-500">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}

