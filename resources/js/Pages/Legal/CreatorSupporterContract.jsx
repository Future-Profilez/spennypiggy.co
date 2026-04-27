import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function CreatorSupporterContract(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Creator Supporter Contract" />
            <LegalLayout activePage="CreatorSupporterContract">
                <div className="mx-auto p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-black text-pink-600 mb-8 uppercase tracking-tighter">
                        Creator Supporter Contract
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-8 mb-4">SPENNY PIGGY</h2>
<h2 className="text-xl md:text-2xl font-black text-gray-900 mt-8 mb-4">STANDARD CONTRACT BETWEEN</h2>
<h2 className="text-xl md:text-2xl font-black text-gray-900 mt-8 mb-4">SUPPORTERS AND CREATORS & PLATFORM ROLE</h2>
<p className="mb-4 text-gray-700 leading-relaxed italic">Issue Date: 23 April 2026</p>
<p className="mb-4 text-gray-700 leading-relaxed">Social Vortex Limited (England & Wales)  ·  Company No. 15233693</p>
<p className="mb-4 text-gray-700 leading-relaxed">Registered Office: 55 Colmore Row, Birmingham, B3 2AA, United Kingdom  ·  VAT: GB452012540</p>
<p className="mb-4 text-gray-700 leading-relaxed">US Entity: Social Vortex, Inc (Delaware, USA)</p>
                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">1.  Introduction</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">1.1  This Standard Contract Between Supporters and Creators (the “Agreement”) governs each transaction entered into between a Supporter and a Creator on Spenny Piggy. This Agreement also sets out the limited role of Spenny Piggy in facilitating those transactions.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">1.2  This Agreement forms part of the Platform Legal Framework and must be read alongside the Spenny Piggy Terms of Service, the Payments, Payouts & Reserves Policy, the Creator Agreement, and the Supporter Terms.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">2.  When This Agreement Applies</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">2.1  This Agreement applies each time a Supporter enters into a transaction with a Creator on Spenny Piggy.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">2.2  This Agreement:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	overrides any conflicting terms proposed by either the Supporter or the Creator in connection with the relevant transaction; and</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	is legally binding on both the Supporter and the Creator upon completion of the transaction.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">3.  Parties</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">3.1  The only parties to each transaction are the Supporter and the Creator. Spenny Piggy (Social Vortex Limited and, where applicable, Social Vortex, Inc.) is not a party to any transaction and does not act as a seller or supplier of any content, goods, or services.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">3.2  Spenny Piggy acts solely as a technology platform and payment facilitator. Its role in connection with each transaction is limited to facilitating payment processing, applying Platform fees, and managing payout timing and risk controls.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">4.  Platform Role and Payment Processing</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">4.1  By entering into a transaction, the Supporter agrees to pay the applicable amount and the Creator agrees to provide the relevant content or service in accordance with their stated offering.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">4.2  By entering into a transaction, both the Supporter and the Creator authorise Spenny Piggy to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	facilitate payment processing via third-party payment providers;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	apply Platform fees at checkout; and</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	manage payout timing and risk controls in accordance with the Payments, Payouts & Reserves Policy.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">5.  Definitions</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">5.1  For the purposes of this Agreement, the following terms shall have the meanings set out below:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	“Creator” – a user offering content, services, or monetisation features through the Platform.</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	“Supporter” – a user purchasing or otherwise interacting with a Creator’s offerings through the Platform.</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	“Transaction” – any payment made between a Supporter and a Creator through the Platform.</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	“Supporter Payment” – all amounts paid by a Supporter in connection with a Transaction, including the Creator’s listed price, Platform fees, and applicable taxes.</div>
                        <div className="ml-6 mb-2 text-gray-700">(v)	“Platform Fee” – fees applied by Spenny Piggy to Supporters at the point of transaction.</div>
                        <div className="ml-6 mb-2 text-gray-700">(vi)	“Content” – all material, interactions, services, and goods provided by Creators through the Platform.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">6.  Pricing and Payment</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.1  By entering into a transaction, the Supporter agrees to pay the total amount displayed at checkout, which may include the Creator’s listed price, Platform fees, payment processing fees, and applicable taxes.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.2  The Creator sets the base price for their offerings and receives their listed amount, subject to applicable reserve deductions, refunds, reversals, chargeback deductions, and any other deductions applied in accordance with the Payments, Payouts & Reserves Policy.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">6.3  Spenny Piggy reserves the right to deduct fees, apply reserves, and delay or adjust payouts in accordance with the Payments, Payouts & Reserves Policy.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">7.  Nature of Transactions</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.1  Transactions on the Platform may include, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	subscriptions;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	one-off content access;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	pay-to-view content;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	paid messages or tasks;</div>
                        <div className="ml-6 mb-2 text-gray-700">(v)	voluntary support payments; and</div>
                        <div className="ml-6 mb-2 text-gray-700">(vi)	timed or conditional payments.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">7.2  Unless explicitly stated otherwise by the Creator, transactions do not guarantee specific outcomes, and Creators retain discretion over the content they produce and make available.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">8.  Licence of Content</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.1  Upon completion of a valid payment, the Creator grants the Supporter a limited, non-transferable, non-exclusive licence to access the relevant Content for the Supporter’s own personal use.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">8.2  This licence does not transfer ownership of any Content or any intellectual property rights therein to the Supporter.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">9.  Ownership of Content</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">9.1  All rights, title, and interest in and to Content remain vested in the Creator at all times. The Supporter does not acquire any ownership rights in any Content by virtue of any Transaction and must not redistribute, copy, exploit, or otherwise deal with Content beyond the scope of the limited licence granted under clause 8.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">10.  Expiry of Licence</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">10.1  The licence granted under clause 8 shall terminate automatically upon the occurrence of any of the following events:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	the relevant payment is reversed or fails;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	the applicable subscription expires;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	the Supporter’s or Creator’s account is suspended or terminated;</div>
                        <div className="ml-6 mb-2 text-gray-700">(iv)	the relevant Content is removed from the Platform; or</div>
                        <div className="ml-6 mb-2 text-gray-700">(v)	either party breaches these Terms or any associated Platform policy.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">11.  Refunds and Cancellation</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">11.1  By completing a transaction, the Supporter agrees to immediate access to the relevant Content and acknowledges that any applicable statutory cooling-off rights may be waived to the fullest extent permitted by applicable law.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">11.2  As a general principle, all transactions are final and non-refundable. However, statutory rights that cannot be waived by law remain unaffected, and refunds may be issued at the discretion of the Creator or Spenny Piggy in exceptional circumstances.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">12.  Obligations Between Supporter and Creator</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">12.1  The Supporter agrees to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	pay the applicable amounts due in connection with each Transaction;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	not abuse Platform payment systems; and</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	not raise fraudulent or bad faith chargebacks or payment disputes.</div>
                        <p className="mb-4 text-gray-700 leading-relaxed">12.2  The Creator agrees to:</p>
                        <div className="ml-6 mb-2 text-gray-700">(i)	provide the relevant Content or service in accordance with their stated offering;</div>
                        <div className="ml-6 mb-2 text-gray-700">(ii)	act in accordance with all applicable laws; and</div>
                        <div className="ml-6 mb-2 text-gray-700">(iii)	maintain all necessary rights in and to the Content they provide.</div>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">13.  No Guarantees</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">13.1  Supporters acknowledge that Creators retain sole control over their Content and that Content may change or be removed at any time. Spenny Piggy does not guarantee the continued availability of any Content.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">13.2  Access to Content may be unavailable where a Supporter’s or Creator’s account is suspended, where the Platform is temporarily unavailable, or where the relevant Content has been removed.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">14.  Physical Goods</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">14.1  Where a transaction relates to a physical item, the relevant third-party retailer is the seller and is solely responsible for fulfilment. Spenny Piggy accepts no responsibility or liability in respect of delivery, product quality, or returns arising from physical goods transactions.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">15.  Disputes and Chargebacks</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">15.1  Supporters must not initiate a chargeback or payment dispute without a genuine and good faith basis for doing so.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">15.2  Creators must cooperate fully with any dispute resolution process initiated in connection with a transaction on their account.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">15.3  Spenny Piggy reserves the right to collect evidence, reverse payments, and recover losses from the relevant Creator in connection with any dispute or chargeback.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">16.  Platform Controls</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">16.1  Spenny Piggy reserves the right, at its sole discretion and at any time, to delay or block payments, apply reserves, suspend accounts, and remove Content where it considers such action necessary for the protection of users, payment processors, or the Platform.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">17.  Compliance and Conduct</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">17.1  All users of the Platform are required to comply with all applicable laws and regulations, comply with all Platform policies forming part of the Platform Legal Framework, and refrain from deceptive, coercive, or abusive behaviour in connection with any transaction or interaction on the Platform.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">18.  Governing Law</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">18.1  This Agreement shall be governed by and construed in accordance with the laws of England and Wales. Where applicable, local mandatory consumer protection provisions may apply and shall not be excluded by the choice of governing law.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">19.  Jurisdiction</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">19.1  Claims arising under or in connection with this Agreement may be brought in the courts of England and Wales, or, where required by applicable law, in the courts of the Supporter’s local jurisdiction.</p>

<p className="mb-4 text-gray-700 leading-relaxed">These Terms were last updated on 23 April 2026.</p>
<p className="mb-4 text-gray-700 leading-relaxed">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
