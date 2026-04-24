import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function PaidTasksTerms(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Paid Tasks Terms" />
            <LegalLayout activePage="PaidTasksTerms">
                <div className="mx-auto p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-black text-pink-600 mb-8 uppercase tracking-tighter">
                        Paid Tasks Terms
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">SPENNY PIGGY</h2>
<h2 className="text-xl md:text-2xl font-bold text-gray-900 mt-8 mb-4">PAID TASKS TERMS</h2>
<p className="mb-4 text-gray-700 leading-relaxed">Issue Date: 23 April 2026</p>
<p className="mb-4 text-gray-700 leading-relaxed">Social Vortex Limited (England & Wales)  ·  Company No. 15233693</p>
<p className="mb-4 text-gray-700 leading-relaxed">Registered Office: 55 Colmore Row, Birmingham, B3 2AA, United Kingdom  ·  VAT: GB452012540</p>
<p className="mb-4 text-gray-700 leading-relaxed">US Entity: Social Vortex, Inc (Delaware, USA)</p>
<p className="mb-4 text-gray-700 leading-relaxed">1.  Introduction and Scope</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.1  These Paid Tasks Terms (the “Terms”) govern the use of the Paid Tasks feature on Spenny Piggy and apply to all Creators who activate, offer, or accept Paid Tasks through the Platform.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.2  These Terms form part of the Platform Legal Framework and supplement the Spenny Piggy Terms of Service, the Creator Agreement, the Supporter Terms, and the Payments, Payouts & Reserves Policy. In the event of any conflict, the order of precedence set out in the Terms of Service shall apply.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1.3  By activating or accepting a Paid Task, a Creator confirms that they have read, understood, and agreed to be bound by these Terms.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">2.  Nature of Paid Tasks</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.1  The Paid Tasks feature enables Supporters to submit paid requests to Creators through the Platform. A Paid Task constitutes an offer by a Supporter to commission a specific piece of content, interaction, or service from a Creator in exchange for payment.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.2  Creators may accept or decline any Paid Task request at their sole and absolute discretion. No Creator is under any obligation to accept a Paid Task request at any time.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2.3  The acceptance of a Paid Task does not create any employment relationship, service contract, agency, or ongoing obligation between the Creator and Spenny Piggy, or between the Creator and the Supporter beyond the specific task accepted.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">3.  Payment and Payouts</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1  Upon submission of a Paid Task request by a Supporter, payment is authorised and secured via the applicable third-party payment processor at the time of submission.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2  Funds are routed to the Creator upon successful completion of the task or in accordance with the applicable payment flow for the specific task type, including without limitation the ‘Paid Task’ flow and the ‘Standard’ flow.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.3  Creators shall receive payouts after delivery of the task has been confirmed or the applicable task period has concluded, subject in all cases to the Payments, Payouts & Reserves Policy and all applicable Platform controls, including without limitation reserves, risk reviews, and compliance checks.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.4  All payments are subject to processing, verification, fraud prevention checks, and Platform risk controls. Funds are not guaranteed and may be delayed, withheld, reversed, or adjusted in accordance with Spenny Piggy’s Terms, payment processor requirements, and risk management policies, including but not limited to reserves, chargebacks, disputes, or suspected misuse.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">4.  Acceptance and Creator Control</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.1  Creators are under no obligation to accept any Paid Task request. Acceptance is entirely at the Creator’s sole discretion.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2  Where a Creator elects to accept a Paid Task, the Creator is solely responsible for setting and communicating:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	the price applicable to the task;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	the scope and nature of the deliverable; and</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	the deadline for delivery.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3  Acceptance of a Paid Task does not create any employment relationship, ongoing service obligation, or contractual relationship beyond the specific task accepted.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">5.  Delivery and Timeframes</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.1  Each Paid Task shall include a clearly defined delivery window, as set by the Creator at the time of acceptance.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.2  Where a task is not delivered within the agreed delivery window, the Platform reserves the right to automatically process a refund to the Supporter in accordance with clause 6 of these Terms.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.3  Extensions to the delivery window and changes to the scope of a task are entirely optional and remain at the Creator’s sole discretion. No Supporter has the right to require a Creator to extend a deadline or modify agreed task parameters.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.4  For the purposes of the Platform, completion of a task is determined by the Platform in its sole discretion, taking into account submission, timing, compliance with the agreed format, and any relevant dispute or risk signals.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">6.  Refunds</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.1  All refunds in connection with Paid Tasks are handled solely by the Platform. Creators are not required to process refunds directly.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.2  Refund eligibility is determined by reference to non-delivery of the task within the agreed delivery window. Refunds are not available on the basis of subjective dissatisfaction with the content or output delivered.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.3  A Paid Task shall be considered delivered and complete once the Creator has submitted the deliverable in the format agreed with the Supporter at the time of acceptance.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.4  Spenny Piggy reserves the right to determine refund eligibility at its sole discretion in accordance with the Payments, Payouts & Reserves Policy.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.5  Notwithstanding the above, the Platform reserves the right, at its sole discretion, to issue refunds, reverse transactions, or withhold funds in cases involving disputes, fraud, chargebacks, policy violations, or risk concerns, regardless of delivery status.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">7.  Service Disclaimer</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.1  Spenny Piggy does not guarantee specific results, outcomes, or quality standards in connection with any Paid Task. Paid Tasks are created and fulfilled by independent Creator users of the Platform, and Spenny Piggy accepts no responsibility or liability in respect of the content, quality, or outcome of any individual task.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.2  Nothing in these Terms limits any non-waivable statutory rights applicable to users in their respective jurisdictions.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">8.  Prohibited Use</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8.1  The Paid Tasks feature must not be used in connection with any of the following, without limitation:</h3>
<div className="ml-6 mb-2 text-gray-700">(i)	any illegal activity or the facilitation of any illegal act;</div>
<div className="ml-6 mb-2 text-gray-700">(ii)	financial coercion or fraud of any kind;</div>
<div className="ml-6 mb-2 text-gray-700">(iii)	the provision of services that require professional licensing or regulated qualifications;</div>
<div className="ml-6 mb-2 text-gray-700">(iv)	any activity involving or intended to cause physical harm or real-world enforcement action; or</div>
<div className="ml-6 mb-2 text-gray-700">(v)	any activity that is prohibited by Platform policies or by the rules or policies of any applicable payment provider.</div>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8.2  Spenny Piggy reserves the right to determine, at its sole discretion, whether any use of the Paid Tasks feature falls within the scope of prohibited use and to take such action as it considers appropriate, including without limitation the removal of the task, restriction of account features, and withholding of associated funds.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">9.  Platform Role</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.1  Spenny Piggy acts as a neutral payment facilitator and workflow provider in connection with all Paid Tasks. Spenny Piggy is not a party to the task itself and does not act as a seller, supplier, employer, or contracting party in respect of any Paid Task.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.2  All contractual obligations arising from a Paid Task exist exclusively between the Creator and the Supporter. Spenny Piggy’s role is limited to facilitating the payment infrastructure, managing payout timing and risk controls, and administering refunds in accordance with these Terms.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.3  The Platform retains full control over payment processing, dispute handling, refunds, and enforcement actions and may take any action it considers necessary to protect the Platform, its users, or its payment infrastructure.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">10.  Relationship to Other Platform Documents</p>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.1  These Terms must be read alongside the Spenny Piggy Terms of Service, the Creator Agreement, the Supporter Terms, and the Payments, Payouts & Reserves Policy, all of which form part of the Platform Legal Framework. In the event of any inconsistency between these Terms and any other document within the Platform Legal Framework, the order of precedence set out in the Terms of Service shall apply.</h3>
<h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.2  This document may be updated at any time to reflect changes in Platform operations, legal or regulatory requirements, or payment provider rules. Continued use of the Paid Tasks feature following the publication of an updated version of these Terms constitutes acceptance of the revised terms.</h3>
<p className="mb-4 text-gray-700 leading-relaxed">These Terms were last updated on 23 April 2026.</p>
<p className="mb-4 text-gray-700 leading-relaxed">© 2026 Social Vortex Limited, trading as Spenny Piggy. All rights reserved.</p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
