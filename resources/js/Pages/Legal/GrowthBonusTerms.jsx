import { Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import LegalLayout from "@/Layouts/LegalLayout";

/**
 * Creator Growth Bonus — Programme Terms.
 *
 * 🚨 THIS IS THE CLIENT'S PART A, TRANSCRIBED WORD FOR WORD. It is legal copy a
 * creator relies on to know what they are owed, so it is never paraphrased,
 * tidied or "improved" here. A wording change is a client decision made in the
 * source document (`docs/client/25 AUG/…Terms_and_Timing_Rule.docx`) and then
 * copied across — never the other way round.
 *
 * ✅ SEVEN CLAUSES WERE CORRECTED ON THE CLIENT'S INSTRUCTION, 26 Aug 2026, after
 * a review found them describing behaviour the platform does not have. The
 * document's own precedence rule is what settled each one — "if they ever
 * disagree, Part B is what the system does and Part A must be corrected to
 * match". What changed, and why it matters:
 *
 *   · 2.1 — Qualifying Earnings are the creator's LISTED SALE VALUE, not the
 *     supporter's charge. The original wording named both ("the gross amount
 *     paid by supporters … measured before the supporter fee") and they are
 *     different figures here: a £100 listing charges £130.55. A £100 listing
 *     now counts as £100. ⚠️ VAT-INCLUSIVE (client, 26 Aug 2026, option (a)) so
 *     a VAT-registered creator is not slowed relative to one who is not.
 *   · 2.5 — NEW, added on the client's instruction: Qualifying Earnings are
 *     explicitly NOT a statement of what the creator receives or retains, since
 *     with VAT included that would not be true. No surface may describe the
 *     figure as money the creator keeps.
 *   · 2.3 — settlement gates PAYMENT, not qualification. As written it also
 *     gated activation, so a sale on day 28 that settled on day 35 would have
 *     cost a creator the programme on a technicality.
 *   · 3.1 — the Activation Window runs from Stripe Connect activation. There is
 *     no "final creator approval" timestamp on this platform to measure from.
 *   · 5.2 / 5.3 / 5.5 — there are no Friday-to-Thursday periods and no Thursday
 *     review gate. Each transaction waits its own 7 days, so the worked example
 *     pays on the Friday of week 4, not week 3.
 *   · 6.1 — the bonus is added to the payout manually today; the automated
 *     separate line item is Phase 3.
 *   · 7.4 — a milestone removed by a refund CAN be earned again by genuine later
 *     sales, but is only ever paid once.
 *   · 8.1 — Fast Start is 5% of NET earnings, not of Qualifying Earnings.
 *
 * 🚨 THE ENGINE AND THIS PAGE NOW AGREE. If you change one, change the other in
 * the same commit, and update the source document — a term the platform does not
 * honour is worse than no term.
 *
 * ⚠️ Part B (the implementation rule) is deliberately NOT published. It is an
 * internal specification, and putting a description of the engine's states and
 * columns on a public legal page invites a creator to argue the implementation
 * rather than the terms.
 */
export default function GrowthBonusTerms(props) {
    const { auth, user } = props;

    return (
        <Guest auth={auth?.user} user={user}>
            <Head title="Creator Growth Bonus Programme Terms" />
            <LegalLayout activePage="GrowthBonusTerms">
                <div className="mx-auto w-full max-w-[92ch] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
                    <h1 className="text-2xl md:text-4xl font-black text-[#FF007F] mb-4 uppercase tracking-tight">
                        Creator Growth Bonus
                    </h1>
                    <p className="mb-10 text-lg font-bold text-gray-900">
                        Programme Terms
                    </p>

                    <div className="prose prose-pink max-w-none">
                        <p className="mb-5 italic leading-relaxed text-gray-700">
                            Last Updated: August 2026
                        </p>

                        <p className="mb-5 leading-relaxed text-gray-700">
                            These terms apply to the Creator Growth Bonus (&quot;the
                            Programme&quot;) offered by Social Vortex Limited trading as
                            Spenny Piggy (&quot;we&quot;, &quot;us&quot;). They sit alongside
                            the Creator Terms. Where the two conflict on the Programme, these
                            terms apply. Earnings are never assured; the Programme is a set of
                            qualifying thresholds, not a promise.
                        </p>

                        <Section id="sec-1-programme" title="1. The Programme">
                            <Clause n="1.1">
                                The Programme is open to the first 150 creators who activate it
                                under clause 3. A place is reserved at the moment of activation,
                                not on registration or profile approval.
                            </Clause>
                            <Clause n="1.2">
                                Under the Programme a creator can earn milestone bonuses of up
                                to £1,000 in total as their cumulative Qualifying Earnings on
                                Spenny Piggy reach the thresholds in clause 4.
                            </Clause>
                            <Clause n="1.3">
                                The Programme runs alongside the Fast Start Bonus, the Founder
                                Bonus and Creator Referrals. Each scheme has its own rules and
                                is assessed separately (clause 8).
                            </Clause>
                        </Section>

                        <Section id="sec-2-qualifying-earnings" title="2. Qualifying Earnings">
                            <Clause n="2.1">
                                &quot;Qualifying Earnings&quot; means the creator&rsquo;s listed
                                sale value for completed, genuine transactions attributed to them
                                on Spenny Piggy — the price the creator set, inclusive of any VAT
                                and before any bonus, and excluding the supporter fee added on top
                                at checkout. A £100 listing counts as £100 of Qualifying Earnings
                                whether or not the creator is registered for VAT.
                            </Clause>
                            <Clause n="2.2">
                                The following are not Qualifying Earnings: payments made by the
                                creator to themselves or by a related party; test transactions;
                                bonus credits; referral rewards; the creator subscription; and
                                any transaction that is refunded, reversed, disputed or charged
                                back.
                            </Clause>
                            <Clause n="2.3">
                                A transaction counts towards Qualifying Earnings on the date it
                                completes. Settlement is not a condition of qualifying — it is a
                                condition of being paid: a milestone bonus is only paid once the
                                transaction that unlocked it has itself settled and been released
                                for payout (clause 5). A transaction held for review does not
                                count until it clears.
                            </Clause>
                            <Clause n="2.4">
                                If a transaction is later refunded, reversed or charged back, it
                                is removed from Qualifying Earnings from the date of the refund,
                                reversal or chargeback (clause 7).
                            </Clause>
                            <Clause n="2.5">
                                Qualifying Earnings measure the value of a creator&rsquo;s sales
                                for the purpose of this Programme. They are not a statement of the
                                amount a creator receives or retains: fees are deducted, and where
                                a creator is registered for VAT part of the listed price is
                                collected on behalf of HM Revenue &amp; Customs. Creators should
                                refer to their payout statements for amounts received.
                            </Clause>
                        </Section>

                        <Section id="sec-3-activation" title="3. Activation">
                            <Clause n="3.1">
                                A creator enters the Programme by reaching £100 of Qualifying
                                Earnings within 30 days of their Spenny Piggy payouts going live
                                (&quot;the Activation Window&quot;). The Activation Window starts
                                on the date the creator&rsquo;s payout account is activated, not
                                on the date of registration.
                            </Clause>
                            <Clause n="3.2">
                                On reaching £100 within the Activation Window the creator is
                                Growth Bonus Active, one of the 150 places is reserved for them,
                                and the first milestone (£25) is unlocked.
                            </Clause>
                            <Clause n="3.3">
                                A creator who does not reach £100 within the Activation Window
                                does not enter the Programme and does not use a place. Their
                                normal use of Spenny Piggy is unaffected.
                            </Clause>
                            <Clause n="3.4">
                                Once all 150 places are reserved the Programme closes to new
                                activations, even where a creator is still within their
                                Activation Window. We will show the number of places remaining
                                on the bonus page.
                            </Clause>
                        </Section>

                        <Section id="sec-4-milestones" title="4. Milestones">
                            <Clause n="4.1">
                                Milestones are cumulative. Each is unlocked once, when the
                                creator&rsquo;s cumulative Qualifying Earnings first reach the
                                threshold.
                            </Clause>

                            {/* ⚠️ Wide content scrolls inside its own container — the page body
                                must never scroll sideways. */}
                            <div className="my-8 overflow-x-auto rounded-box border-black">
                                <table className="w-full min-w-[480px] text-left">
                                    <thead>
                                        <tr className="bg-[#E6EA7B]">
                                            <Th>Cumulative Qualifying Earnings</Th>
                                            <Th>Bonus unlocked</Th>
                                            <Th>Cumulative bonus</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {LADDER.map(([gmv, unlocked, cumulative]) => (
                                            <tr
                                                key={gmv}
                                                className="border-t-2 border-black/10"
                                            >
                                                <Td strong>{gmv}</Td>
                                                <Td>{unlocked}</Td>
                                                <Td>{cumulative}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Clause n="4.2">
                                A creator who crosses more than one threshold in a single
                                transaction unlocks every threshold crossed, subject to clauses
                                2 and 7.
                            </Clause>
                            <Clause n="4.3">
                                A creator who is Growth Bonus Active has 12 months from their
                                activation date to reach further milestones. Any milestone not
                                reached by then expires and cannot be earned. We may extend this
                                period at our discretion; we will not shorten it for a creator
                                who is already active.
                            </Clause>
                        </Section>

                        <Section
                            id="sec-5-timing"
                            title="5. When a milestone is earned — the timing rule"
                        >
                            <Clause n="5.1">
                                A milestone is earned at the exact moment the settled
                                transaction that takes cumulative Qualifying Earnings to or past
                                the threshold is completed (&quot;the Qualifying Moment&quot;).
                                The Qualifying Moment is recorded to the second, in UK time.
                            </Clause>
                            <Clause n="5.2">
                                Payouts run every Friday, UK time. Each transaction waits seven
                                days from the date it completes before it is eligible, so a
                                transaction is paid on the first Friday that falls at least seven
                                days after it completed.
                            </Clause>
                            <Clause n="5.3">
                                A milestone bonus is paid on the same payout as the transaction
                                that created the Qualifying Moment. In practice that is seven to
                                thirteen days after the milestone is reached, depending on the day
                                of the week it is reached on.
                            </Clause>
                            <Clause n="5.4">
                                A milestone bonus is never brought forward into an earlier
                                payout, even where most of the earnings that led to the threshold
                                were made earlier. It is the transaction that crosses the line
                                that decides when the bonus is paid, not the ones before it.
                            </Clause>
                            <Clause n="5.5">
                                Worked example. A creator reaches £90 of Qualifying Earnings
                                during week 1. On the Saturday of week 2 they make a further £10,
                                taking them to £100 — that Saturday is the Qualifying Moment, and
                                the £25 milestone is unlocked immediately. That £10 transaction
                                waits its own seven days, so it is not eligible for the Friday of
                                week 3; it is paid on the Friday of week 4, and the £25 bonus is
                                paid with it.
                            </Clause>
                            <Clause n="5.6">
                                The bonus is paid only if the transaction that created the
                                Qualifying Moment has itself settled and been released for
                                payout. If it is refunded, reversed or disputed before the
                                payout, the milestone is not paid and cumulative Qualifying
                                Earnings are recalculated.
                            </Clause>
                        </Section>

                        <Section id="sec-6-payment" title="6. Payment">
                            <Clause n="6.1">
                                Milestone bonuses are paid to the same bank account as the
                                creator&rsquo;s normal payout, alongside the payout that carries
                                the qualifying transaction. Each bonus is reviewed and released by
                                us before it is paid.
                            </Clause>
                            <Clause n="6.2">
                                Bonuses are paid in pounds sterling. Where a creator is paid in
                                another currency, the bonus is converted at the same rate
                                applied to that payout.
                            </Clause>
                            <Clause n="6.3">
                                We may hold a milestone bonus for review where we have reason to
                                believe the underlying transactions are not genuine, and may
                                withhold it where they are not.
                            </Clause>
                        </Section>

                        <Section
                            id="sec-7-refunds"
                            title="7. Refunds, reversals and chargebacks"
                        >
                            <Clause n="7.1">
                                If a transaction that counted towards Qualifying Earnings is
                                refunded, reversed or charged back, Qualifying Earnings are
                                recalculated without it.
                            </Clause>
                            <Clause n="7.2">
                                Any milestone that has been unlocked but not yet paid and that
                                the recalculated total no longer supports is cancelled.
                            </Clause>
                            <Clause n="7.3">
                                Any milestone that has already been paid and that the
                                recalculated total no longer supports may be recovered by offset
                                against future bonuses or future payouts, or, at our discretion,
                                treated as retained. We will tell the creator which.
                            </Clause>
                            <Clause n="7.4">
                                Where a milestone has been cancelled under clause 7.2 and the
                                creator&rsquo;s Qualifying Earnings later rise back above the
                                threshold through further genuine sales, that milestone is earned
                                again. No milestone is ever paid more than once.
                            </Clause>
                        </Section>

                        <Section id="sec-8-other-schemes" title="8. Other bonus schemes">
                            <Clause n="8.1">
                                Fast Start Bonus (5% of a creator&rsquo;s net earnings in their
                                first 30 days) runs alongside the Programme. The Fast Start Bonus
                                is not itself counted as Qualifying Earnings.
                            </Clause>
                            <Clause n="8.2">
                                Founder Bonus is a separate scheme with its own qualification
                                (£2,500 net in the first 30 days, first 150 founders). Being
                                Growth Bonus Active does not make a creator a Founder, and vice
                                versa.
                            </Clause>
                            <Clause n="8.3">
                                Creator Referrals are separate. Referral rewards are not
                                Qualifying Earnings for either the referrer or the referred
                                creator.
                            </Clause>
                            <Clause n="8.4">
                                The creator subscription remains payable and is unaffected by
                                the Programme.
                            </Clause>
                        </Section>

                        <Section id="sec-9-general" title="9. General">
                            <Clause n="9.1">
                                Bonuses are payments in connection with the creator&rsquo;s
                                business on Spenny Piggy. Creators are responsible for their own
                                tax on them.
                            </Clause>
                            <Clause n="9.2">
                                We may suspend or end the Programme for new activations at any
                                time. Creators who are already Growth Bonus Active keep their
                                entitlement under these terms for the remainder of their
                                12-month period.
                            </Clause>
                            <Clause n="9.3">
                                We may change these terms for creators who are not yet active.
                                For creators who are already active, changes apply only where
                                they are favourable to the creator or required by law.
                            </Clause>
                            <Clause n="9.4">
                                Any creator found to be manipulating Qualifying Earnings
                                forfeits all unpaid bonuses and may have their Spenny Piggy
                                account closed under the Creator Terms.
                            </Clause>
                            <Clause n="9.5">
                                These terms are governed by the law of England and Wales.
                            </Clause>
                        </Section>
                    </div>
                </div>
            </LegalLayout>
        </Guest>
    );
}

/**
 * ⚠️ The ladder is transcribed from the terms document, NOT read from
 * `config/growth_bonus.php`. On every other surface the figures come from the
 * config that pays, and that rule is right there — but a legal page states what
 * the creator agreed to on the day, and a table that silently rewrites itself
 * when an operator edits a config value is the opposite of a term. If the
 * ladder ever changes, the client issues new terms and this table is updated
 * with them.
 */
const LADDER = [
    ["£100", "£25", "£25"],
    ["£250", "£25", "£50"],
    ["£500", "£50", "£100"],
    ["£1,000", "£50", "£150"],
    ["£2,500", "£75", "£225"],
    ["£5,000", "£75", "£300"],
    ["£7,500", "£100", "£400"],
    ["£10,000", "£100", "£500"],
    ["£15,000", "£150", "£650"],
    ["£20,000", "£150", "£800"],
    ["£25,000", "£200", "£1,000"],
];

const Section = ({ id, title, children }) => (
    <>
        <h2
            id={id}
            className="mt-14 mb-4 scroll-mt-24 text-xl font-black text-gray-900"
        >
            {title}
        </h2>
        {children}
    </>
);

const Clause = ({ n, children }) => (
    <p className="mb-5 leading-relaxed text-gray-700">
        <span className="font-bold text-gray-900">{n}</span>&nbsp;&nbsp;
        {children}
    </p>
);

const Th = ({ children }) => (
    <th className="px-4 py-3 text-[11px] font-black uppercase tracking-widest text-black md:px-6">
        {children}
    </th>
);

const Td = ({ children, strong }) => (
    <td
        className={`px-4 py-3 text-gray-700 md:px-6 ${strong ? "font-black text-gray-900" : ""}`}
    >
        {children}
    </td>
);
