import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function FastStartBonusTerms(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Fast Start Bonus Programme Terms" />
            <LegalLayout activePage="FastStartBonusTerms">
                <div className="mx-auto w-full max-w-[92ch] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
                    <h1 className="text-2xl md:text-4xl font-black text-[#FF007F] mb-10 uppercase tracking-tight">
                        FAST START BONUS PROGRAMME TERMS & CONDITIONS
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <p className="mb-5 text-gray-700 leading-relaxed italic">Last Updated: June 2026</p>

                        <h2 id="sec-1-promoter" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">1. Promoter</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">The Fast Start Bonus Programme is operated by:</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Social Vortex Ltd<br />
                            55 Colmore Row<br />
                            Birmingham<br />
                            England<br />
                            B3 2AA<br />
                            United Kingdom<br />
                            and/or<br />
                            Social Vortex Inc.<br />
                            1111B S Governors Ave STE 7527<br />
                            Dover, Delaware 19904<br />
                            United States
                        </p>

                        <h2 id="sec-2-overview" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">2. Overview</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">Eligible creators will receive an additional bonus equal to 5% of qualifying creator earnings generated during their first 30 days following creator account approval.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">The Fast Start Bonus is calculated automatically following the creator&apos;s initial 30-day qualification period.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">Before any Fast Start Bonus payment is made, Spenny Piggy will review qualifying earnings and verify eligibility, including any refunds, disputes, chargebacks, payment reversals, fraud reviews, compliance reviews, or other adjustments that may affect qualification.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">Subject to these Terms, the Fast Start Bonus will normally be paid automatically with the creator&apos;s next eligible payout following completion of the review process, which will generally occur approximately seven (7) days following the end of the creator&apos;s Fast Start Bonus Period.</p>

                        <h2 id="sec-3-eligibility" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">3. Eligibility</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">Creators must complete onboarding, complete identity verification, maintain an approved creator account, maintain a valid payout account, comply with platform rules, and operate only one creator account. Multiple creator accounts are prohibited and may result in forfeiture of bonuses and account suspension.</p>

                        <h2 id="sec-4-fast-start-bonus-period" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">4. Fast Start Bonus Period</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">The Fast Start Bonus Period begins when a creator account is approved and remains active for 30 consecutive calendar days. The period cannot be paused, renewed, restarted, transferred, or extended.</p>

                        <h2 id="sec-5-qualifying-earnings" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">5. Qualifying Earnings</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">Only qualifying creator earnings generated through completed supporter transactions qualify. Referral bonuses, Fast Start Bonus payments, Founder's Bonus payments, promotional credits, manual account credits, refunds, chargebacks, reversed transactions, fraudulent transactions, artificial transactions, self-funded transactions, and non-genuine transactions do not qualify.</p>

                        <h2 id="sec-6-payment-of-fast-start-bonus" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">6. Payment of Fast Start Bonus</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">The Fast Start Bonus is not paid immediately upon qualification.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">Following the conclusion of the creator&apos;s Fast Start Bonus Period, Spenny Piggy will review qualifying earnings and verify eligibility before any Fast Start Bonus payment is processed.</p>
                        <p className="mb-2 font-bold text-gray-900">During this review process, Spenny Piggy may assess:</p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>Refund activity</li>
                            <li>Chargebacks</li>
                            <li>Payment disputes</li>
                            <li>Payment reversals</li>
                            <li>Fraud prevention checks</li>
                            <li>Compliance reviews</li>
                            <li>Artificial transactions</li>
                            <li>Self-funded transactions</li>
                            <li>Platform policy violations</li>
                            <li>Any other activity affecting eligibility or qualifying earnings</li>
                        </ul>
                        <p className="mb-5 text-gray-700 leading-relaxed">Where refunds, disputes, chargebacks, reversals, fraud concerns, compliance issues, or other adjustments affect qualifying earnings, Spenny Piggy may recalculate, reduce, adjust, delay, withhold, recover, reverse, or cancel any Fast Start Bonus payment.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">Following completion of the review process, the Fast Start Bonus will normally be paid automatically with the creator&apos;s next eligible payout, which will generally occur approximately seven (7) days following the end of the creator&apos;s Fast Start Bonus Period.</p>
                        <p className="mb-2 font-bold text-gray-900">Examples:</p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>£100 earnings = £5 Fast Start Bonus</li>
                            <li>£1,000 earnings = £50 Fast Start Bonus</li>
                            <li>£2,500 earnings = £125 Fast Start Bonus</li>
                        </ul>
                        <p className="mb-5 text-gray-700 leading-relaxed">The Fast Start Bonus is paid automatically and requires no action from the creator.</p>

                        <h2 id="sec-7-relationship-to-the-founder-s-bonus-programme" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">7. Relationship to the Founder's Bonus Programme</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">The Fast Start Bonus Programme and Founder's Bonus Programme are separate promotions. Creators who generate at least £2,500 in qualifying creator earnings during their first 30 days may become eligible for the Founder's Bonus Programme, subject to creator verification requirements, the Founder's Bonus Terms & Conditions, and founder place availability.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">Achieving £2,500 in qualifying creator earnings does not trigger an immediate Founder's Bonus payment. The £2,500 threshold is a qualification requirement only.</p>
                        
                        <p className="mb-2 font-bold text-gray-900">Example Timeline</p>
                        <p className="mb-2 font-bold text-gray-900">Month 1 (Days 1–30)</p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>Creator earns qualifying creator earnings.</li>
                            <li>Creator receives normal creator payouts in accordance with the platform payout schedule.</li>
                            <li>If the creator generates at least £2,500 in qualifying creator earnings during this period, they become eligible for the Fast Start Bonus Programme and the Founder's Bonus Programme (subject to founder place availability and all eligibility requirements).</li>
                        </ul>

                        <p className="mb-2 font-bold text-gray-900">Following Day 30</p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>Spenny Piggy reviews qualifying earnings.</li>
                            <li>Refunds, disputes, chargebacks, payment reversals, fraud reviews, compliance reviews, and other adjustments are assessed.</li>
                        </ul>

                        <p className="mb-2 font-bold text-gray-900">Next Eligible Payout (normally approximately Day 37)</p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>Fast Start Bonus is automatically calculated and paid.</li>
                            <li>Example: £2,500 qualifying earnings = £125 Fast Start Bonus payment.</li>
                        </ul>

                        <p className="mb-2 font-bold text-gray-900">Month 2</p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>Creator continues earning normally.</li>
                            <li>If the creator qualified for the Founder's Bonus Programme, monthly qualifying earnings begin being tracked for Founder&apos;s Bonus purposes.</li>
                        </ul>

                        <p className="mb-2 font-bold text-gray-900">Month 3</p>
                        <ul className="list-disc pl-5 sm:pl-6 mb-5 space-y-1.5 text-gray-700 leading-relaxed">
                            <li>Spenny Piggy calculates the Founder&apos;s Bonus based on qualifying earnings generated during the previous monthly bonus period.</li>
                            <li>Founder&apos;s Bonus payments are processed separately in accordance with the Founder&apos;s Bonus Terms & Conditions.</li>
                        </ul>

                        <p className="mb-5 text-gray-700 leading-relaxed">Fast Start Bonus payments and Founder's Bonus payments are separate incentives and operate under separate payment schedules.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">Founder places are allocated on a first-qualified, first-confirmed basis. Once all founder places have been allocated, the Founder's Bonus Programme closes to new participants. The closure of the Founder's Bonus Programme does not affect the Fast Start Bonus Programme.</p>

                        <h2 id="sec-8-abuse-prevention" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">8. Abuse Prevention</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">Spenny Piggy reserves the right to withhold, cancel, recover, reverse, reduce, adjust, delay, or refuse bonus payments where fraud, duplicate accounts, identity verification circumvention, artificial transactions, self-funding, earnings manipulation, referral abuse, bad-faith conduct, policy breaches, or other misuse is suspected.</p>

                        <h2 id="sec-9-changes-suspension-or-withdrawal" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">9. Changes, Suspension or Withdrawal</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">Spenny Piggy reserves the right to modify, suspend, replace, withdraw, amend, or terminate the Fast Start Bonus Programme at any time.</p>

                        <h2 id="sec-10-limitation-of-liability" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">10. Limitation of Liability</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">To the fullest extent permitted by law, Spenny Piggy shall not be liable for any indirect, incidental, consequential, special, punitive, economic, or business losses arising from participation in the programme.</p>

                        <h2 id="sec-11-general" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">11. General</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">Participation in the programme does not create any employment, partnership, agency, joint venture, or similar relationship.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">Spenny Piggy may update these Terms & Conditions from time to time and continued participation constitutes acceptance of any updated version.</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">All decisions regarding qualification, eligibility, bonus calculations, and bonus payments shall be final.</p>

                        <h2 id="sec-12-contact" className="text-xl font-black text-gray-900 mt-14 mb-4 scroll-mt-24">12. Contact</h2>
                        <p className="mb-5 text-gray-700 leading-relaxed">support@spennypiggy.co</p>
                        <p className="mb-5 text-gray-700 leading-relaxed">
                            Social Vortex Ltd<br />
                            55 Colmore Row<br />
                            Birmingham<br />
                            England<br />
                            B3 2AA<br />
                            and/or<br />
                            Social Vortex Inc.<br />
                            1111B S Governors Ave STE 7527<br />
                            Dover, Delaware 19904<br />
                            United States
                        </p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
