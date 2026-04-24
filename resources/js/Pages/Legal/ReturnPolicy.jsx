import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function ReturnPolicy(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Return Policy" />
            <LegalLayout activePage="ReturnPolicy">
                <div className="mx-auto p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-black text-pink-600 mb-8 uppercase tracking-tighter">
                        Return Policy
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">SPENNY PIGGY</h2>
<h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">RETURN, REFUND AND CANCELLATION POLICY</h2>
<p className="mb-4 text-gray-700 leading-relaxed">Last Updated: 23 April 2026</p>
<p className="mb-4 text-gray-700 leading-relaxed">Social Vortex Limited (England & Wales)  ·  Company No. 15233693</p>
<p className="mb-4 text-gray-700 leading-relaxed">Registered Office: 55 Colmore Row, Birmingham, B3 2AA, United Kingdom  ·  VAT: GB452012540</p>
<p className="mb-4 text-gray-700 leading-relaxed">US Entity: Social Vortex, Inc (Delaware, USA)</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.  Introduction and Scope</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.1  This Return, Refund and Cancellation Policy (the “Policy”) applies to all purchases, subscriptions, payments, and transactions made through the Spenny Piggy platform (the “Platform”), operated by Social Vortex Limited, trading as Spenny Piggy.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.2  This Policy forms part of the Platform Legal Framework and must be read alongside the Spenny Piggy Terms of Service, the Payments, Payouts & Reserves Policy, the Creator Agreement, and the Supporter Terms. In the event of any conflict, the order of precedence set out in the Terms of Service shall apply.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.3  Nothing in this Policy excludes, restricts, or modifies any right or remedy to which you may be entitled under applicable consumer protection legislation, including the Consumer Rights Act 2015, the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, and any other applicable mandatory law. Your statutory rights are not affected by this Policy.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">2.  Digital Content and Creator Transactions</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.1  General position</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.1.1  The Platform facilitates transactions for digital content, subscriptions, memberships, paid messages, paid tasks, tribute payments, voluntary support payments, and other creator-led interactions (collectively, “Creator Content”). As a general principle, all such transactions are final and non-refundable once completed.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2  Waiver of cancellation rights for immediate-access digital content</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2.1  Under the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, consumers ordinarily have a 14-day right to cancel a contract for digital content. However, this right may be waived where:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	the consumer expressly requests that performance of the contract begin immediately; and</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	the consumer acknowledges that they will lose their right to cancel once performance has commenced.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2.2  At the point of purchase of any immediate-access digital content on the Platform, you will be presented with a specific confirmation requiring you to actively acknowledge that:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	you are requesting immediate access to the content; and</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	you acknowledge that your 14-day cancellation right will be lost once access is provided.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2.3  Where you have provided that confirmation, your statutory cancellation right in respect of that transaction is waived to the fullest extent permitted by applicable law, and the transaction is non-refundable.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2.4  Where the required confirmation has not been obtained at the point of purchase, your statutory cancellation rights remain intact in respect of that transaction.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3  Circumstances in which refunds may be available for digital content</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3.1  Notwithstanding clause 2.1, a refund may be available in connection with a Creator Content transaction in the following circumstances:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	the content was not delivered or made accessible within any timeframe communicated by the Creator;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	the content is materially different from its description at the point of purchase in a manner that constitutes misrepresentation;</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	a refund is required by applicable law that cannot be excluded by contract; or</div>
<div className="ml-6 mb-2 text-gray-700">(iv)	a refund is approved at the sole discretion of Spenny Piggy or the relevant Creator in exceptional circumstances.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3.2  Refunds are not available on the basis of subjective dissatisfaction with content that has been delivered in accordance with its description.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3.3  All refund determinations in respect of Creator Content transactions are made by Spenny Piggy at its sole discretion, in accordance with the Payments, Payouts & Reserves Policy.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">3.  Subscriptions and Recurring Billing</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1  Cancellation of subscriptions</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1.1  You may cancel a subscription to a Creator at any time through your account settings. Cancellation will take effect at the end of the current billing period and will prevent further charges from being applied. Cancellation does not entitle you to a refund in respect of any charges already made for the current or any prior billing period.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2  Automatic renewal</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2.1  Subscriptions renew automatically on the applicable billing cycle unless cancelled by you prior to the renewal date. You are solely responsible for cancelling your subscription before renewal if you do not wish to be charged for a further billing period. Spenny Piggy accepts no liability for charges resulting from your failure to cancel a subscription before renewal.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">4.  Physical Goods (Wishlist and Storefront Purchases)</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.1  Retailer responsibility</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.1.1  Where you purchase a physical item through the Platform, that item is fulfilled by an independent third-party retailer. The retailer is the seller of the physical item and is solely responsible for fulfilment, delivery, returns, and refunds in respect of that item.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2  Statutory rights in respect of physical goods</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2.1  Your statutory rights in respect of physical goods purchased through the Platform are exercisable against the relevant retailer as the seller of those goods. Under the Consumer Rights Act 2015, goods must be of satisfactory quality, fit for purpose, and as described. Where goods do not meet these standards, you may be entitled to a repair, replacement, or refund from the retailer.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2.2  Spenny Piggy accepts no responsibility or liability in respect of the quality, delivery, availability, or return of physical goods. Any claims arising from a physical goods purchase must be directed to the relevant retailer in the first instance.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3  Platform intervention</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3.1  Spenny Piggy reserves the right, at its sole discretion, to cancel transactions, issue credits, or otherwise intervene in connection with physical goods purchases where it considers such action necessary for the protection of users, the Platform, or its payment infrastructure.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">5.  Monetary Gifts and Voluntary Support Payments</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.1  Monetary gifts, tribute payments, tips, and other voluntary support payments made to Creators through the Platform are made on a discretionary basis and are, by their nature, non-refundable once completed. No obligation to deliver specific content or services arises from the making of a voluntary support payment unless explicitly agreed between the Supporter and the Creator at the time of payment.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.2  Where a payment was made under a genuine and demonstrable error, you may contact Spenny Piggy support to request a review. Any refund in such circumstances is at the sole discretion of Spenny Piggy.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">6.  Chargebacks and Payment Disputes</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.1  You must not initiate a chargeback or payment dispute with your card issuer or payment provider without a genuine and good faith basis for doing so. Prior to initiating any dispute through your payment provider, you are required to contact Spenny Piggy support at support@spennypiggy.co in the first instance.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.2  Initiating a chargeback without good faith, including in respect of transactions where the digital content waiver was properly obtained, may result in:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	restriction or suspension of your account;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	recovery of the disputed amount and any associated fees; and</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	referral to debt recovery proceedings where appropriate.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.3  Spenny Piggy reserves the right to contest any chargeback and to provide evidence to the relevant payment processor in support of that contest.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">7.  Platform Discretion</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.1  Notwithstanding any other provision of this Policy, Spenny Piggy reserves the right, at its sole and absolute discretion, to issue refunds, reverse transactions, or withhold funds in cases involving disputes, fraud, chargebacks, policy violations, or risk concerns, regardless of delivery status or the general principles set out in this Policy.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.2  Any refund issued by Spenny Piggy under this clause does not constitute an admission of liability or an obligation to issue refunds in similar circumstances in the future.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">8.  Your Statutory Rights</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8.1  This Policy does not affect your statutory rights under applicable consumer protection legislation. In particular:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	the Consumer Rights Act 2015 provides that digital content must be of satisfactory quality, fit for purpose, and as described;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	the Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 provide certain cancellation rights in respect of contracts concluded at a distance, subject to the exceptions set out in this Policy; and</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	nothing in this Policy excludes or limits your rights in respect of fraudulent misrepresentation.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8.2  If you believe your statutory rights have been infringed, you may contact Spenny Piggy support at support@spennypiggy.co. You also have the right to refer your complaint to an alternative dispute resolution body or to the relevant consumer protection authority in your jurisdiction.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">9.  How to Request a Refund</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.1  To request a refund or raise a complaint in connection with a transaction, please contact Spenny Piggy support at:</h3>
<p className="mb-4 text-gray-700 leading-relaxed">–	Email: support@spennypiggy.co</p>
<p className="mb-4 text-gray-700 leading-relaxed">–	Telephone: 020 335 52057</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.2  Please include your account details, the date and nature of the transaction, the amount paid, and the reason for your request. We will acknowledge your request and respond within a reasonable timeframe.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.3  Where a refund is approved, it will be processed to the original payment method used for the transaction. Processing times are subject to your payment provider’s timelines and are not within Spenny Piggy’s control once the refund has been initiated.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">10.  Policy Updates</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.1  This Policy may be updated from time to time to reflect changes in applicable law, Platform operations, or payment provider requirements. Continued use of the Platform following the publication of an updated Policy constitutes acceptance of the revised terms. The date at the top of this Policy indicates when it was last updated.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">This Policy was last updated on 23 April 2026.</p>
<p className="mb-4 text-gray-700 leading-relaxed">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
