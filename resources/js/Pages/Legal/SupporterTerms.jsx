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
                    <h1 className="text-3xl md:text-4xl font-black text-[#FF007F] mb-8 uppercase tracking-tighter">
                        Supporter Terms
                    </h1>
                    <div className="prose prose-pink max-w-none">
<p className="mb-4 text-gray-700 leading-relaxed">Issue Date: 23 April 2026</p>
<p className="mb-4 text-gray-700 leading-relaxed">Social Vortex Limited (England & Wales)  ·  Company No. 15233693</p>
<p className="mb-4 text-gray-700 leading-relaxed">Registered Office: 55 Colmore Row, Birmingham, B3 2AA, United Kingdom  ·  VAT: GB452012540</p>
<p className="mb-4 text-gray-700 leading-relaxed">US Entity: Social Vortex, Inc (Delaware, USA)</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">1. Scope and Contracting Position</h2>
<p className="mb-4 text-gray-700 leading-relaxed">1.1 Application</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.1.1 These Supporter Terms apply to any user who purchases content, subscribes to a Creator, sends payments or tips, buys product-linked items, or otherwise interacts with monetisation features on the Platform.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.2 Who You Contract With</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.1 Unless explicitly stated otherwise by Spenny Piggy in writing for a specific feature or flow, all transactions conducted through the Platform are entered into directly between the Supporter and the relevant Creator. The Creator is the Merchant of Record for all creator-led transactions.</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.2.2 Spenny Piggy provides the Platform, facilitates payments, and applies platform fees, but is not the seller or supplier of any Creator Content.</p>

<p className="mb-4 text-gray-700 leading-relaxed">1.3 Platform Role</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.3.1 Spenny Piggy enables transactions between users, applies fees, and manages risk controls. Spenny Piggy does not:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	guarantee the quality, legality, or fulfilment of any Creator Content;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	act as a merchant or contracting party in relation to Creator transactions; or</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	accept liability for the acts or omissions of any Creator.</div>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">2. Account Use and Payment Authorisation</h2>
<p className="mb-4 text-gray-700 leading-relaxed">2.1 Eligibility</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.1.1 To make purchases or payments through the Platform, you must:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	be at least 18 years of age;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	have the legal authority to use your chosen payment method; and</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	provide accurate and complete payment details.</div>

<p className="mb-4 text-gray-700 leading-relaxed">2.2 Payment Authorisation</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.2.1 By completing a transaction on the Platform, you authorise the applicable payment processor to charge your payment method for:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	the Creator’s listed price;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	applicable Platform fees;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	applicable taxes; and</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	recurring payments, where you have subscribed to a recurring billing arrangement.</div>
<p className="mb-4 text-gray-700 leading-relaxed">2.2.2 The key acknowledgements applicable to each transaction are set out in Schedule 1 (Checkout Acknowledgements) to these Terms.</p>

<p className="mb-4 text-gray-700 leading-relaxed">2.3 Security Checks</p>
<p className="mb-4 text-gray-700 leading-relaxed">2.3.1 Transactions may be subject to security and verification procedures including 3D Secure authentication, identity verification, and fraud checks. Spenny Piggy and its payment processors reserve the right to refuse or cancel any payment or block any transaction at their sole discretion.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">3. Fees, Pricing and Recurring Billing</h2>
<p className="mb-4 text-gray-700 leading-relaxed">3.1 Total Price</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.1.1 The total amount charged to you in connection with any transaction may include the Creator’s listed price, Platform fees, payment processing fees, and applicable taxes. The total amount payable will be displayed at checkout prior to completion of the transaction.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.2 Subscriptions and Recurring Billing</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.2.1 Where you subscribe to a Creator, billing will recur automatically on the applicable billing cycle until you cancel your subscription. You are solely responsible for cancelling your subscription prior to renewal if you do not wish to be charged for a further billing period.</p>

<p className="mb-4 text-gray-700 leading-relaxed">3.3 External Charges</p>
<p className="mb-4 text-gray-700 leading-relaxed">3.3.1 You are solely responsible for any bank fees, foreign exchange fees, or card issuer charges arising in connection with your use of the Platform. Such charges are determined by your financial institution and are not controlled by Spenny Piggy.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">4. Refunds, Chargebacks and Complaints</h2>
<p className="mb-4 text-gray-700 leading-relaxed">4.1 Refund Policy</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.1.1 All transactions relating to Creator Content are, as a general principle, final and non-refundable, except where required by applicable law or approved by Spenny Piggy or the relevant Creator in exceptional circumstances.</p>

<p className="mb-4 text-gray-700 leading-relaxed">4.2 Physical Goods</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.2.1 Where a transaction relates to a physical item, responsibility for fulfilment, delivery, returns, and product quality rests with the relevant third-party retailer. Spenny Piggy accepts no responsibility or liability in respect of such matters.</p>

<p className="mb-4 text-gray-700 leading-relaxed">4.3 Chargebacks</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.3.1 You must not file a chargeback or payment dispute without a genuine and good faith basis for doing so, and you must not abuse chargeback or dispute systems. Prior to initiating any dispute through your payment provider or card issuer, you are required to contact Spenny Piggy support in the first instance.</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.3.2 Abuse of the chargeback process may result in restriction or removal of your account.</p>
<p className="mb-4 text-gray-700 leading-relaxed">4.3.3 Schedule 2 (When to Contact Support First) to these Terms sets out examples of circumstances in which you are required to contact Spenny Piggy support prior to raising a dispute with your payment provider.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">5. Creator Interactions and Platform Safety</h2>
<p className="mb-4 text-gray-700 leading-relaxed">5.1 Creator Independence</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.1.1 Creators are independent users of the Platform. Spenny Piggy does not guarantee the quality, legality, or fulfilment of any Creator Content, and accepts no liability for the acts or omissions of any Creator.</p>

<p className="mb-4 text-gray-700 leading-relaxed">5.2 User Conduct</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.2.1 You must not, in your use of the Platform or in your interactions with Creators or other users:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	harass, threaten, or intimidate any person;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	engage in blackmail or any form of exploitation; or</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	engage in any other harmful, abusive, or unlawful conduct.</div>
<p className="mb-4 text-gray-700 leading-relaxed">5.2.2 The conduct standards applicable to your use of the Platform are further set out in Schedule 3 (Conduct Expectations) to these Terms.</p>

<p className="mb-4 text-gray-700 leading-relaxed">5.3 Platform Controls</p>
<p className="mb-4 text-gray-700 leading-relaxed">5.3.1 Spenny Piggy reserves the right, at its sole discretion, to remove content, cancel transactions, and restrict or terminate accounts where it considers such action necessary for the protection of users, the Platform, or third parties.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">6. Wishlist and Product-Linked Purchases</h2>
<p className="mb-4 text-gray-700 leading-relaxed">6.1 Retail Model</p>
<p className="mb-4 text-gray-700 leading-relaxed">6.1.1 Where you purchase a physical item through the Platform, the relevant third-party retailer is the seller and is responsible for fulfilment. Spenny Piggy facilitates the transaction but is not the seller, supplier, or fulfiller of physical goods.</p>

<p className="mb-4 text-gray-700 leading-relaxed">6.2 Platform Limitations</p>
<p className="mb-4 text-gray-700 leading-relaxed">6.2.1 Spenny Piggy accepts no responsibility or liability in respect of delivery, stock availability, or retailer decisions in connection with physical goods transactions.</p>

<p className="mb-4 text-gray-700 leading-relaxed">6.3 Transaction Controls</p>
<p className="mb-4 text-gray-700 leading-relaxed">6.3.1 Spenny Piggy reserves the right to cancel transactions, issue refunds, or otherwise intervene in connection with physical goods purchases where it considers such action necessary.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">7. Liability and General Terms</h2>
<p className="mb-4 text-gray-700 leading-relaxed">7.1 Limitation of Liability</p>
<p className="mb-4 text-gray-700 leading-relaxed">7.1.1 To the maximum extent permitted by applicable law, Spenny Piggy shall not be liable for:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	the conduct, acts, or omissions of any Creator;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	the non-performance or defective performance of any Creator Content;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	issues arising from the fulfilment or non-fulfilment of physical goods by third-party retailers; or</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	failures, delays, or actions of third-party payment processors or other service providers.</div>

<p className="mb-4 text-gray-700 leading-relaxed">7.2 Relationship to Other Documents</p>
<p className="mb-4 text-gray-700 leading-relaxed">7.2.1 These Supporter Terms form part of the Platform Legal Framework and must be read alongside the Spenny Piggy Terms of Service and the Payments, Payouts & Reserves Policy. In the event of any conflict, the order of precedence set out in the Terms of Service shall apply.</p>

<p className="mb-4 text-gray-700 leading-relaxed">7.3 Communications and Evidence</p>
<p className="mb-4 text-gray-700 leading-relaxed">7.3.1 When submitting support requests, you must provide accurate information and report issues promptly. Spenny Piggy may request supporting evidence including receipts, screenshots, or message history in connection with any dispute or complaint. Failure to cooperate with reasonable requests for evidence may limit the support available to you.</p>

<p className="mb-4 text-gray-700 leading-relaxed">7.4 Accounts and Termination</p>
<p className="mb-4 text-gray-700 leading-relaxed">7.4.1 You may cease using the Platform at any time. Spenny Piggy reserves the right to suspend or terminate accounts where fraud is suspected, Platform policies have been breached, or legal or regulatory requirements so require.</p>
<p className="mb-4 text-gray-700 leading-relaxed">7.4.2 Obligations incurred prior to account closure or termination shall survive, including without limitation outstanding disputes, debts, and any ongoing investigations.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">Schedule 1 — Checkout Acknowledgements</h2>
<p className="mb-4 text-gray-700 leading-relaxed">By completing a transaction on the Platform, you acknowledge and agree that:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	you are purchasing directly from the Creator, who acts as the Merchant of Record;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	Platform fees and applicable taxes may be added to the Creator’s listed price;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	subscriptions renew automatically until cancelled by you;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	transactions relating to Creator Content are, as a general principle, final and non-refundable; and</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	physical goods are fulfilled by independent third-party retailers, and Spenny Piggy accepts no responsibility for their delivery or quality.</div>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">Schedule 2 — When to Contact Support First</h2>
<p className="mb-4 text-gray-700 leading-relaxed">Prior to initiating any dispute through your payment provider or card issuer, you are required to contact Spenny Piggy support in the first instance in connection with the following, without limitation:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	duplicate charges;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	unexpected subscription renewals;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	misleading or misrepresented content;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	failed or undelivered product orders; and</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	suspected unauthorised activity on your account.</div>
<p className="mb-4 text-gray-700 leading-relaxed">Prompt reporting improves the likelihood of a satisfactory resolution outcome.</p>

<h2 className="text-xl font-black text-gray-900 mt-10 mb-4">Schedule 3 — Conduct Expectations</h2>
<p className="mb-4 text-gray-700 leading-relaxed">In your use of the Platform and in all communications with Creators, other users, and Spenny Piggy, you must:</p>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	communicate honestly and in good faith;</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	act respectfully towards all other users and Platform personnel; and</div>
<div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	refrain from making false, misleading, or bad faith claims.</div>
<p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy reserves the right to record communications and to use such records in connection with the resolution of disputes or the enforcement of these Terms.</p>
<p className="mb-4 text-gray-700 leading-relaxed">These Terms were last updated on 23 April 2026.</p>
<p className="mb-4 text-gray-700 leading-relaxed">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
