import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

export default function FastStartBonusTerms(props) {
    const { auth, user } = props;
    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Fast Start Bonus Programme Terms" />
            <LegalLayout activePage="FastStartBonusTerms">
                <div className="mx-auto p-0 lg:p-12">
                    <h1 className="mx-auto p-0 text-2xl md:text-4xl font-black text-[#FF007F] mb-8 uppercase tracking-tighter-12">
                        FAST START BONUS PROGRAMME TERMS & CONDITIONS
                    </h1>
                    <div className="prose prose-pink max-w-none">
                        <p className="mb-4 text-gray-700 leading-relaxed italic">Last Updated: June 2026</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">1. Promoter</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">The Fast Start Bonus Programme is operated by:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">
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

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">2. Overview</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">Eligible creators will receive an additional bonus equal to 5% of qualifying creator earnings generated during their first 30 days following creator account approval. The Fast Start Bonus is applied automatically and paid alongside eligible weekly creator payouts.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">3. Eligibility</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">Creators must complete onboarding, complete identity verification, maintain an approved creator account, maintain a valid payout account, comply with platform rules, and operate only one creator account. Multiple creator accounts are prohibited and may result in forfeiture of bonuses and account suspension.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">4. Fast Start Bonus Period</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">The Fast Start Bonus Period begins when a creator account is approved and remains active for 30 consecutive calendar days. The period cannot be paused, renewed, restarted, transferred, or extended.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">5. Qualifying Earnings</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">Only qualifying creator earnings generated through completed supporter transactions qualify. Referral bonuses, Fast Start Bonus payments, Founder's Bonus payments, promotional credits, manual account credits, refunds, chargebacks, reversed transactions, fraudulent transactions, artificial transactions, self-funded transactions, and non-genuine transactions do not qualify.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">6. Payment of Fast Start Bonus</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">The Fast Start Bonus is calculated automatically and added to weekly creator payouts.</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 leading-relaxed">
                            <li>Example: £100 earnings = £105 payout</li>
                            <li>Example: £1,000 earnings = £1,050 payout</li>
                            <li>Example: £2,500 earnings = £2,625 payout</li>
                        </ul>
                        <p className="mb-4 text-gray-700 leading-relaxed">The Fast Start Bonus is applied automatically and requires no action from the creator.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">7. Relationship to the Founder's Bonus Programme</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">The Fast Start Bonus Programme and Founder's Bonus Programme are separate promotions. Creators who generate at least £2,500 in qualifying creator earnings during their first 30 days may become eligible for the Founder's Bonus Programme, subject to creator verification requirements, the Founder's Bonus Terms & Conditions, and founder place availability.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">Achieving £2,500 in qualifying creator earnings does not trigger an immediate Founder's Bonus payment. The £2,500 threshold is a qualification requirement only.</p>
                        
                        <p className="mb-2 font-bold text-gray-900">Month 1:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 leading-relaxed">
                            <li>Creator earns £2,500+ and receives Fast Start Bonus payments.</li>
                            <li>Creator qualifies for the Founder's Bonus Programme.</li>
                        </ul>

                        <p className="mb-2 font-bold text-gray-900">Month 2:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 leading-relaxed">
                            <li>Creator earns normally.</li>
                            <li>Spenny Piggy records qualifying earnings for bonus calculation purposes.</li>
                        </ul>

                        <p className="mb-2 font-bold text-gray-900">Month 3:</p>
                        <ul className="list-disc pl-6 mb-4 text-gray-700 leading-relaxed">
                            <li>Spenny Piggy calculates the creator's qualifying earnings from the previous monthly bonus period.</li>
                            <li>Founder's Bonus equals 10% of qualifying earnings from that monthly bonus period.</li>
                            <li>The bonus payment is processed separately.</li>
                        </ul>
                        <p className="mb-4 text-gray-700 leading-relaxed">Founder's Bonus payments are generally processed within 30 days following the end of the applicable monthly bonus period and may be paid separately from standard creator payouts.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">Founder places are allocated on a first-qualified, first-confirmed basis. Once all founder places have been allocated, the Founder's Bonus Programme closes to new participants.</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">The closure of the Founder's Bonus Programme does not affect the Fast Start Bonus Programme, which may continue indefinitely unless amended, suspended, withdrawn, or terminated by Spenny Piggy.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">8. Abuse Prevention</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy reserves the right to withhold, cancel, recover, reverse, or refuse bonuses where fraud, duplicate accounts, identity verification circumvention, artificial transactions, self-funding, earnings manipulation, referral abuse, bad-faith conduct, or policy breaches are suspected.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">9. Changes, Suspension or Withdrawal</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">Spenny Piggy reserves the right to modify, suspend, replace, withdraw, or terminate the Fast Start Bonus Programme at any time.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">10. Limitation of Liability</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">To the fullest extent permitted by law, Spenny Piggy shall not be liable for indirect, incidental, consequential, special, punitive, or economic loss arising from participation in the programme.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">11. General</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">Participation in the programme does not create an employment, partnership, agency, or joint venture relationship. Spenny Piggy may update these terms from time to time.</p>

                        <h2 className="text-xl font-black text-gray-900 mt-10 mb-4">12. Contact</h2>
                        <p className="mb-4 text-gray-700 leading-relaxed">For questions relating to the Fast Start Bonus Programme contact support@spennypiggy.co or write to:</p>
                        <p className="mb-4 text-gray-700 leading-relaxed">
                            Social Vortex Ltd, 55 Colmore Row, Birmingham, England, B3 2AA, United Kingdom<br />
                            or<br />
                            Social Vortex Inc., 1111B S Governors Ave STE 7527, Dover, Delaware 19904, United States.
                        </p>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}
