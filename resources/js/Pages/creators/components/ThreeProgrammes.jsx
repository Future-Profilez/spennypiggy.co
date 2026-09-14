import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import {
    FAST_START,
    FOUNDER,
    MEMBERSHIP_CREDIT,
    REFERRAL,
    money,
    percent,
} from '@/constants/creatorBonuses';
import { useIncentives } from '@/lib/incentives';
import { ACCENT, LedgerFrame, LedgerRow } from './Ledger';

/**
 * "Three programmes that stack" — the bonuses block.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, §3a and §3b: *"Three
 * programmes that stack block reused unchanged"*, listed between "Moving from
 * [Competitor]" and the final CTA on every vs page. It had never been built
 * there.
 *
 * 🚨 ONE DEFINITION, LIFTED OUT OF `creators/Index.jsx` RATHER THAN COPIED.
 * "Reused unchanged" is the instruction; a second copy is the thing that stops
 * being unchanged. `Index` imports this now.
 *
 * 🚨 EVERY FIGURE COMES FROM `creatorBonuses.js`, NEVER TYPED. These are Google
 * Ads destinations — a wrong number here is a wrong number in an advert — and
 * the referral reward is never shown without its qualifying threshold, because
 * quoting £50 alone sets a creator up to share a link and be paid nothing.
 *
 * ⚠️ THESE ARE QUALIFYING THRESHOLDS, NOT PROMISED EARNINGS, and the lead says
 * so. Keep that sentence with the block wherever it is mounted.
 *
 * ⚠️ The HEAD is drawn by the caller — fixed copy, page's own head style. Same
 * rule as `HoldsUpBlock`.
 */
export const THREE_PROGRAMMES = {
    eyebrow: 'Paid on top',
    lead: 'Each one is a qualifying threshold, not a promise. Earnings are never assured and terms apply.',
};

/**
 * 🚨 THE ROWS ARE DECIDED BY THE SERVER'S FLAGS, NOT BY THE CONSTANTS
 * (11 Sep 2026). Founder and Fast Start were retired; both rows and the
 * "How the founder bonus works" link disappear with them, and the two live
 * programmes — creator referrals and earning your membership back — take
 * their place. This is a Google Ads destination, so a row describing a scheme
 * nobody can join is an advert for something that does not exist.
 *
 * ⚠️ The block keeps its name and its "three programmes" copy is in the
 * caller's head — the row count is now whatever is live, and the heading was
 * deliberately left to the caller for exactly this reason.
 */
export default function ThreeProgrammes({ className = '' }) {
    const incentives = useIncentives();

    return (
        <div className={className}>
            <LedgerFrame>
                {incentives.founderBonus && (
                    <LedgerRow
                        title="Founder bonus"
                        line={`First ${FOUNDER.seats} creators to earn ${money(FOUNDER.qualifyingNet)} net in ${FOUNDER.windowDays} days. Founders then earn ${percent(FOUNDER.monthlyRate)} on top of monthly earnings, up to ${money(FOUNDER.monthlyCap)} a month.`}
                        figure={percent(FOUNDER.monthlyRate)}
                        tag="monthly"
                    />
                )}
                {incentives.fastStart && (
                    <LedgerRow
                        title="Fast start bonus"
                        line={`An extra ${percent(FAST_START.rate)} on everything you earn in your first ${FAST_START.windowDays} days, paid alongside your normal payout.`}
                        figure={percent(FAST_START.rate)}
                        tag={`${FAST_START.windowDays} days`}
                    />
                )}
                <LedgerRow
                    title="Creator referrals"
                    line={`${money(incentives.referral.reward)} for every creator you bring, paid once they have earned ${money(incentives.referral.threshold)}. Your link is in your dashboard from day one.`}
                    figure={money(incentives.referral.reward)}
                    tag="per creator"
                />
                {incentives.membershipCredits && (
                    <LedgerRow
                        title="Earn your membership back"
                        line={`Every ${money(incentives.membershipCredit.threshold ?? MEMBERSHIP_CREDIT.threshold)} you earn buys a free month of your creator membership. It is a credit against your own bill, never cash.`}
                        figure={`${incentives.membershipCredit.months} month`}
                        tag={`per ${money(incentives.membershipCredit.threshold)}`}
                    />
                )}
            </LedgerFrame>

            {incentives.founderBonus && (
                <Link
                    href="/creators/founder-bonus"
                    className="mt-6 inline-flex min-h-[44px] items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70"
                    style={{ textDecorationColor: ACCENT.bonus }}
                >
                    How the founder bonus works
                    <ArrowRight size={14} />
                </Link>
            )}
        </div>
    );
}
