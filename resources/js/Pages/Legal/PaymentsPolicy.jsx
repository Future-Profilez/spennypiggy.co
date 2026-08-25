import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function PaymentsPolicy(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Reserves and Payments Policy" />
            <LegalLayout activePage="PaymentsPolicy">
                <div className="mx-auto w-full max-w-[92ch] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
                    <h1 className="text-2xl md:text-4xl font-black text-[#FF007F] mb-10 uppercase tracking-tight">
                        Reserves and Payments Policy
                    </h1>
                    <div className="prose prose-pink max-w-none">
<p className="mb-5 text-gray-700 leading-relaxed italic">Issue Date: 23 April 2026</p>
<p className="mb-5 text-gray-700 leading-relaxed">Social Vortex Limited (England & Wales)  ·  Company No. 15233693</p>
<p className="mb-5 text-gray-700 leading-relaxed">Registered Office: 55 Colmore Row, Birmingham, B3 2AA, United Kingdom  ·  VAT: GB452012540</p>
<p className="mb-5 text-gray-700 leading-relaxed">US Entity: Social Vortex, Inc (Delaware, USA)</p>
                        <h2 id="sec-1-platform-overview-and-role" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">1.  Platform Overview and Role</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">1.1  Spenny Piggy is a technology platform that enables transactions between users. It is not a bank, financial institution, payment service provider, or regulated entity in respect of the transactions it facilitates.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">1.2  For all creator-led transactions processed via the Platform, the Creator acts as the Merchant of Record. All payments are processed via third-party payment providers and are subject to platform review, fraud checks, dispute monitoring, and compliance controls.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">1.3  In connection with transactions conducted through the Platform, Spenny Piggy:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	facilitates transactions between users;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	applies Platform Fees at checkout; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	manages payout timing and risk controls.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">1.4  Spenny Piggy does not act as a bank or financial institution in respect of any funds held or disbursed through the Platform.</p>

                        <h2 id="sec-2-payment-processing" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">2.  Payment Processing</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">2.1  All payments are processed through third-party payment providers. Payments are made to Creators as Merchant of Record and are subject to the rules and controls of the applicable payment processor and to Spenny Piggy’s own risk and compliance review.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">2.2  For the purposes of risk assessment and fraud prevention, Spenny Piggy may monitor, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	transaction velocity;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	payment patterns;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	dispute rates;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	account behaviour; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	device and geographic signals.</div>

                        <h2 id="sec-3-payout-schedule" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">3.  Payout Schedule</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">3.1  Creators are paid on a weekly payout cycle. The standard earnings period runs from Friday to Thursday, with the standard payout day being the following Friday.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">3.2  Payouts are not guaranteed on any specific date and remain subject to:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	account status;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	dispute activity;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	applicable reserve requirements;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	compliance checks; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	payment processor settlement timelines.</div>

                        <h2 id="sec-4-payment-reviews-and-delays" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">4.  Payment Reviews and Delays</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">4.1  For the purposes of protecting users, payment partners, and the integrity of the Platform, Spenny Piggy reserves the right to delay, pause, split, reverse, or refuse any payout at its sole discretion.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">4.2  Such action may be taken where Spenny Piggy detects or reasonably suspects, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	unusual payment activity;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	elevated dispute or refund risk;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	sudden increases in transaction volume;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	suspected fraud or abuse;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	policy violations;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(vi)	missing or incomplete verification;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(vii)	linked or associated account risk;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(viii) moderation concerns; or</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ix)	legal or regulatory requests.</div>
                        <h2 id="sec-5-reserve-policy" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">5.  Reserve Policy</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">5.1  To manage payment risk, Spenny Piggy may apply a rolling reserve to any Creator account. A reserve constitutes the temporary withholding of a percentage of earnings prior to disbursement, pending release in accordance with this Policy.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">5.2  Spenny Piggy applies reserves in accordance with the following standard framework, based on each account’s risk classification:</p>
                        
                        <div className="my-8 overflow-x-auto rounded-box border border-gray-200">
                            <table className="w-full min-w-[560px] divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-black/60 uppercase tracking-wider">Account Classification</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-black/60 uppercase tracking-wider">Reserve Rate</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-black/60 uppercase tracking-wider">Holding Period</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 leading-relaxed">Established accounts – strong history, no material risk indicators</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">0%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">N/A</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 leading-relaxed">New or recently activated accounts</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">10%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">30 days</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 leading-relaxed">Moderate risk – rapid growth, unusual volume, incomplete history</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">15%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">60 days</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 leading-relaxed">Elevated risk – increased disputes, high refund activity, abnormal patterns</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">20%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">90 days</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 leading-relaxed">High risk – suspected fraud, chargeback exposure, compliance concerns, platform abuse</td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">Up to 30% or full hold</td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">As determined by Spenny Piggy</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p className="mb-5 text-gray-700 leading-relaxed">5.3  In addition to the standard framework set out above, Spenny Piggy may apply a full temporary hold on all funds where required for:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	the purposes of an ongoing investigation;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	compliance with payment partner requirements; or</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	the fulfilment of legal obligations.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">5.4  Spenny Piggy reserves the right to apply, modify, or remove reserves at any time based on updated risk assessment, without prior notice to the Creator.</p>
                        <h2 id="sec-6-reserve-release" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">6.  Reserve Release</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">6.1  Rolling reserve amounts shall be released automatically upon expiry of the applicable holding period, subject to the following conditions being met:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	the account remains compliant with these Terms and all associated Platform policies; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	no new disputes, risk events, or compliance concerns have arisen during the holding period.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">6.2  The applicable holding periods are 30 days, 60 days, and 90 days, as determined by the Creator’s risk classification in accordance with clause 5.2.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">6.3  Spenny Piggy reserves the right to reduce, extend, increase, or remove any reserve at any time based on updated risk assessment. Where risk persists beyond any stated holding period, reserved funds may be held for such further duration as Spenny Piggy considers necessary.</p>

                        <h2 id="sec-7-chargebacks-refunds-and-offsets" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">7.  Chargebacks, Refunds and Offsets</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">7.1  Spenny Piggy reserves the right to deduct from a Creator’s available balance, earnings, or reserve funds any amounts arising from or in connection with:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	chargebacks;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	refunds;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	transaction reversals;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	retailer adjustments; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	Platform losses attributable to the relevant Creator account.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">7.2  Where deductions result in a negative balance on a Creator’s account:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	the negative balance may be carried forward; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	future payouts may be reduced or withheld until the negative balance is recovered in full.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">7.3  The foregoing rights are without prejudice to any other recovery rights available to Spenny Piggy under the Terms of Service or applicable law.</p>

                        <h2 id="sec-8-physical-goods-wishlist-and-storefront-purchases" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">8.  Physical Goods (Wishlist and Storefront Purchases)</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">8.1  Where a Supporter purchases a physical item through the Platform, fulfilment of that item is handled by an independent third-party retailer via Spenny Piggy’s commerce infrastructure partners.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">8.2  The relevant retailer is solely responsible for:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	shipping and delivery;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	returns and refund decisions; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	product quality and stock availability.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">8.3  Spenny Piggy accepts no responsibility or liability in respect of:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	delivery delays;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	lost or damaged items;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	stock availability; or</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	retailer refund decisions.</div>

                        <h2 id="sec-9-moderation-and-payment-controls" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">9.  Moderation and Payment Controls</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">9.1  Spenny Piggy operates an interconnected content and payment control framework. Where content or account activity gives rise to risk, Spenny Piggy may, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	pause listings;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	restrict checkout functionality;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	delay payouts;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	apply reserves; or</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	suspend accounts.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">9.2  Such action may be taken where Spenny Piggy identifies, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	misrepresentation;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	prohibited activity;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	policy violations; or</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	unsafe or non-compliant behaviour.</div>

                        <h2 id="sec-10-account-restrictions" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">10.  Account Restrictions</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">10.1  Spenny Piggy reserves the right to restrict, suspend, or terminate account features and access, at its sole discretion, where:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	a user has breached the Terms of Service or any associated Platform policy;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	fraud risk is detected or reasonably suspected;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	compliance checks are required; or</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	the integrity of the payment infrastructure is considered to be at risk.</div>

                        <h2 id="sec-11-risk-monitoring" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">11.  Risk Monitoring</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">11.1  Spenny Piggy operates a continuous risk monitoring framework. Risk signals assessed by Spenny Piggy may include, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	rapid transaction growth;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	high-value transactions;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	repeat payment patterns;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	dispute frequency;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	cross-account behaviour;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(vi)	geographic inconsistencies; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(vii)	disproportionate account age relative to transaction volume.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">11.2  Risk determinations are made by reference to the overall account profile and are not limited to any single signal or indicator. </p>

                        <h2 id="sec-12-record-keeping-and-audit" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">12.  Record Keeping and Audit</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">12.1  Spenny Piggy may retain records including, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	transaction data;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	payout history;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	reserve history;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	dispute evidence; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(v)	moderation actions.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">12.2  Such records may be used for the purposes of compliance, audit, dispute resolution, and fulfilment of payment processor requirements.</p>

                        <h2 id="sec-13-security-and-account-integrity" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">13.  Security and Account Integrity</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">13.1  Spenny Piggy may implement security controls including, without limitation:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	account verification procedures;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	login monitoring;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	device checks; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iv)	automated fraud detection systems.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">13.2  Where account compromise is suspected, Spenny Piggy may, at its sole discretion:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	pause payouts;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	lock account access; and</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	require re-verification before access or payouts are restored.</div>

                        <h2 id="sec-14-payment-partner-and-platform-protection" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">14.  Payment Partner and Platform Protection</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">14.1  Spenny Piggy reserves the right to apply controls that exceed standard operational parameters where it considers such measures necessary to:</p>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(i)	protect its relationships with payment processors;</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(ii)	maintain the stability and integrity of the Platform; or</div>
                        <div className="ml-6 mb-2 text-gray-700 leading-relaxed">(iii)	prevent financial loss to the Platform or its payment partners.</div>
                        <p className="mb-5 text-gray-700 leading-relaxed">14.2  Spenny Piggy is not required to disclose its internal risk thresholds, scoring methodologies, or the specific basis for any individual risk determination.</p>

                        <h2 id="sec-15-policy-updates" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">15.  Policy Updates</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">15.1  This Policy forms part of the Platform Legal Framework and is incorporated by reference into the Spenny Piggy Terms of Service. It may be updated at any time to reflect changes in fraud trends, legal or regulatory requirements, payment partner rules, or operational improvements.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">15.2  Continued use of the Platform following the publication of an updated Policy constitutes acceptance of the revised terms. Users are responsible for reviewing this Policy periodically.</p>

<p className="mb-5 text-gray-700 leading-relaxed">These Terms were last updated on 23 April 2026.</p>
<p className="mb-5 text-gray-700 leading-relaxed">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
