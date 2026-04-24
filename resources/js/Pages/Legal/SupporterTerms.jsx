import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function SupporterTerms(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Supporter Terms" />
            <LegalLayout activePage="SupporterTerms">
                <div className="mx-auto p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-black text-pink-600 mb-8 uppercase tracking-tighter">
                        Supporter Terms
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">SPENNY PIGGY</h2>
<h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">SUPPORTER TERMS</h2>
<p className="mb-4 text-gray-700 leading-relaxed">Issue Date: 23 April 2026</p>
<p className="mb-4 text-gray-700 leading-relaxed">Social Vortex Limited (England & Wales)  ·  Company No. 15233693</p>
<p className="mb-4 text-gray-700 leading-relaxed">Registered Office: 55 Colmore Row, Birmingham, B3 2AA, United Kingdom  ·  VAT: GB452012540</p>
<p className="mb-4 text-gray-700 leading-relaxed">US Entity: Social Vortex, Inc (Delaware, USA)</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.  Scope and Contracting Position</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.1  Application</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.1.1  These Supporter Terms apply to any user who purchases content, subscribes to a Creator, sends payments or tips, buys product-linked items, or otherwise interacts with monetisation features on the Platform.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.2  Who You Contract With</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.2.1  Unless explicitly stated otherwise by Spenny Piggy in writing for a specific feature or flow, all transactions conducted through the Platform are entered into directly between the Supporter and the relevant Creator. The Creator is the Merchant of Record for all creator-led transactions.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.2.2  Spenny Piggy provides the Platform, facilitates payments, and applies platform fees, but is not the seller or supplier of any Creator Content.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.3  Platform Role</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.3.1  Spenny Piggy enables transactions between users, applies fees, and manages risk controls. Spenny Piggy does not:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	guarantee the quality, legality, or fulfilment of any Creator Content;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	act as a merchant or contracting party in relation to Creator transactions; or</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	accept liability for the acts or omissions of any Creator.</div>
<p className="mb-4 text-gray-700 leading-relaxed">2.  Account Use and Payment Authorisation</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.1  Eligibility</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.1.1  To make purchases or payments through the Platform, you must:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	be at least 18 years of age;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	have the legal authority to use your chosen payment method; and</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	provide accurate and complete payment details.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2  Payment Authorisation</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2.1  By completing a transaction on the Platform, you authorise the applicable payment processor to charge your payment method for:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	the Creator’s listed price;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	applicable Platform fees;</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	applicable taxes; and</div>
<div className="ml-6 mb-2 text-gray-700">(iv)	recurring payments, where you have subscribed to a recurring billing arrangement.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2.2  The key acknowledgements applicable to each transaction are set out in Schedule 1 (Checkout Acknowledgements) to these Terms.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3  Security Checks</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3.1  Transactions may be subject to security and verification procedures including 3D Secure authentication, identity verification, and fraud checks. Spenny Piggy and its payment processors reserve the right to refuse or cancel any payment or block any transaction at their sole discretion.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">3.  Fees, Pricing and Recurring Billing</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1  Total Price</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1.1  The total amount charged to you in connection with any transaction may include the Creator’s listed price, Platform fees, payment processing fees, and applicable taxes. The total amount payable will be displayed at checkout prior to completion of the transaction.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2  Subscriptions and Recurring Billing</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2.1  Where you subscribe to a Creator, billing will recur automatically on the applicable billing cycle until you cancel your subscription. You are solely responsible for cancelling your subscription prior to renewal if you do not wish to be charged for a further billing period.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.3  External Charges</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.3.1  You are solely responsible for any bank fees, foreign exchange fees, or card issuer charges arising in connection with your use of the Platform. Such charges are determined by your financial institution and are not controlled by Spenny Piggy.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">4.  Refunds, Chargebacks and Complaints</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.1  Refund Policy</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.1.1  All transactions relating to Creator Content are, as a general principle, final and non-refundable, except where required by applicable law or approved by Spenny Piggy or the relevant Creator in exceptional circumstances.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2  Physical Goods</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2.1  Where a transaction relates to a physical item, responsibility for fulfilment, delivery, returns, and product quality rests with the relevant third-party retailer. Spenny Piggy accepts no responsibility or liability in respect of such matters.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3  Chargebacks</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3.1  You must not file a chargeback or payment dispute without a genuine and good faith basis for doing so, and you must not abuse chargeback or dispute systems. Prior to initiating any dispute through your payment provider or card issuer, you are required to contact Spenny Piggy support in the first instance.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3.2  Abuse of the chargeback process may result in restriction or removal of your account.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3.3  Schedule 2 (When to Contact Support First) to these Terms sets out examples of circumstances in which you are required to contact Spenny Piggy support prior to raising a dispute with your payment provider.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">5.  Creator Interactions and Platform Safety</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.1  Creator Independence</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.1.1  Creators are independent users of the Platform. Spenny Piggy does not guarantee the quality, legality, or fulfilment of any Creator Content, and accepts no liability for the acts or omissions of any Creator.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.2  User Conduct</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.2.1  You must not, in your use of the Platform or in your interactions with Creators or other users:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	harass, threaten, or intimidate any person;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	engage in blackmail or any form of exploitation; or</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	engage in any other harmful, abusive, or unlawful conduct.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.2.2  The conduct standards applicable to your use of the Platform are further set out in Schedule 3 (Conduct Expectations) to these Terms.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.3  Platform Controls</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.3.1  Spenny Piggy reserves the right, at its sole discretion, to remove content, cancel transactions, and restrict or terminate accounts where it considers such action necessary for the protection of users, the Platform, or third parties.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">6.  Wishlist and Product-Linked Purchases</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.1  Retail Model</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.1.1  Where you purchase a physical item through the Platform, the relevant third-party retailer is the seller and is responsible for fulfilment. Spenny Piggy facilitates the transaction but is not the seller, supplier, or fulfiller of physical goods.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.2  Platform Limitations</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.2.1  Spenny Piggy accepts no responsibility or liability in respect of delivery, stock availability, or retailer decisions in connection with physical goods transactions.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.3  Transaction Controls</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.3.1  Spenny Piggy reserves the right to cancel transactions, issue refunds, or otherwise intervene in connection with physical goods purchases where it considers such action necessary.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">7.  Liability and General Terms</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.1  Limitation of Liability</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.1.1  To the maximum extent permitted by applicable law, Spenny Piggy shall not be liable for:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	the conduct, acts, or omissions of any Creator;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	the non-performance or defective performance of any Creator Content;</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	issues arising from the fulfilment or non-fulfilment of physical goods by third-party retailers; or</div>
<div className="ml-6 mb-2 text-gray-700">(iv)	failures, delays, or actions of third-party payment processors or other service providers.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.2  Relationship to Other Documents</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.2.1  These Supporter Terms form part of the Platform Legal Framework and must be read alongside the Spenny Piggy Terms of Service and the Payments, Payouts & Reserves Policy. In the event of any conflict, the order of precedence set out in the Terms of Service shall apply.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.3  Communications and Evidence</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.3.1  When submitting support requests, you must provide accurate information and report issues promptly. Spenny Piggy may request supporting evidence including receipts, screenshots, or message history in connection with any dispute or complaint. Failure to cooperate with reasonable requests for evidence may limit the support available to you.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.4  Accounts and Termination</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.4.1  You may cease using the Platform at any time. Spenny Piggy reserves the right to suspend or terminate accounts where fraud is suspected, Platform policies have been breached, or legal or regulatory requirements so require.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.4.2  Obligations incurred prior to account closure or termination shall survive, including without limitation outstanding disputes, debts, and any ongoing investigations.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">Schedule 1 — Checkout Acknowledgements</p>
<p className="mb-4 text-gray-700 leading-relaxed">By completing a transaction on the Platform, you acknowledge and agree that:</p>
<div className="ml-6 mb-2 text-gray-700">(i)	you are purchasing directly from the Creator, who acts as the Merchant of Record;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	Platform fees and applicable taxes may be added to the Creator’s listed price;</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	subscriptions renew automatically until cancelled by you;</div>
<div className="ml-6 mb-2 text-gray-700">(iv)	transactions relating to Creator Content are, as a general principle, final and non-refundable; and</div>
<div className="ml-6 mb-2 text-gray-700">(v)	physical goods are fulfilled by independent third-party retailers, and Spenny Piggy accepts no responsibility for their delivery or quality.</div>
<p className="mb-4 text-gray-700 leading-relaxed">Schedule 2 — When to Contact Support First</p>
<p className="mb-4 text-gray-700 leading-relaxed">Prior to initiating any dispute through your payment provider or card issuer, you are required to contact Spenny Piggy support in the first instance in connection with the following, without limitation:</p>
<div className="ml-6 mb-2 text-gray-700">(i)	duplicate charges;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	unexpected subscription renewals;</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	misleading or misrepresented content;</div>
<div className="ml-6 mb-2 text-gray-700">(iv)	failed or undelivered product orders; and</div>
<div className="ml-6 mb-2 text-gray-700">(v)	suspected unauthorised activity on your account.</div>
<p className="mb-4 text-gray-700 leading-relaxed">Prompt reporting improves the likelihood of a satisfactory resolution outcome.</p>
<p className="mb-4 text-gray-700 leading-relaxed">Schedule 3 — Conduct Expectations</p>
<p className="mb-4 text-gray-700 leading-relaxed">In your use of the Platform and in all communications with Creators, other users, and Spenny Piggy, you must:</p>
<div className="ml-6 mb-2 text-gray-700">(i)	communicate honestly and in good faith;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	act respectfully towards all other users and Platform personnel; and</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	refrain from making false, misleading, or bad faith claims.</div>
<p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy reserves the right to record communications and to use such records in connection with the resolution of disputes or the enforcement of these Terms.</p>
<p className="mb-4 text-gray-700 leading-relaxed">These Terms were last updated on 23 April 2026.</p>
<p className="mb-4 text-gray-700 leading-relaxed">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
