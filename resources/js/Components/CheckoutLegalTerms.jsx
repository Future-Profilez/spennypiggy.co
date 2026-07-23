import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function CheckoutLegalTerms({ onAgreeChange }) {
    const [expanded, setExpanded] = useState(false);

    const handleCheck = (e) => {
        onAgreeChange(e.target.checked);
    };

    return (
        <div className="checkout-legal-terms text-left w-full mt-4 !pb-4 ">
            <label className="flex items-start cursor-pointer mb-3">
                <input
                    type="checkbox"
                    className="mt-1 mr-3 rounded border-gray-300 text-[#FF007F] focus:ring-pink-500 cursor-pointer w-5 h-5"
                    onChange={handleCheck}
                />
                <span className="!text-start text-normal font-medium text-gray-900 leading-tight pt-1">
                    I agree to the <Link target="_blank" className="text-violet-600 hover:underline" href={route("terms-and-conditions")}>Terms of Service</Link> and <Link target="_blank" className="text-violet-600 hover:underline" href={route("terms-and-conditions")}>Privacy Policy</Link>.
                </span>
            </label>

            <div className="pl-9 pr-2 ">
                <p className="text-sm text-gray-700 font-semibold mb-2">By continuing, I confirm that:</p>
                <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1.5 mb-3">
                    <li>I am purchasing from the creator, not Spenny Piggy</li>
                    <li>This purchase may provide immediate access to digital content, memberships, or creator rewards</li>
                    <li>I request immediate access where applicable and acknowledge that this may remove my right to cancel</li>
                    <li>This purchase may be non-refundable except where required by law</li>
                </ul>

                <button 
                    type="button" 
                    onClick={() => setExpanded(!expanded)}
                    className="text-violet-600 text-sm font-semibold flex items-center hover:underline focus:outline-none mb-4">
                    View full purchase terms
                    <svg className={`ml-1 w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {expanded && (
                    <div className="mt-3 mb-4 p-4 bg-gray-50 rounded-box-sm border border-gray-200">
                        <p className="text-sm text-gray-700 font-semibold mb-2">By completing this purchase, I acknowledge and agree that:</p>
                        <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1.5">
                            <li>Payments are made directly to the creator, who is the merchant of record and solely responsible for the content, products, and fulfilment</li>
                            <li>Spenny Piggy acts as a technology platform facilitating payments and is not the seller of any goods or services</li>
                            <li>For digital content, memberships, or access-based products, access may be provided immediately after payment and is considered fulfilled at the point access is granted</li>
                            <li>Where I request immediate access to digital content or services, I expressly consent to this and understand that I may lose any applicable cancellation rights once access has been provided</li>
                            <li>For content unlocks and creator services, I acknowledge that I am making a non-refundable purchase of creator content, which may include access to content or other creator-defined deliverables</li>
                            <li>For physical goods (if applicable), the creator is responsible for delivery, fulfilment, and any applicable returns or refunds in accordance with their stated terms</li>
                            <li>I have reviewed the creator’s profile, content, or offering and understand what I am purchasing before completing this transaction</li>
                            <li>To the extent permitted by law, refunds, disputes, or claims relating to the purchase must be directed to the creator</li>
                            <li>I agree that my acceptance of these terms, combined with completing payment, constitutes a legally binding electronic agreement</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
