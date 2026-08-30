import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import {
    FAST_START,
    FOUNDER,
    REFERRAL,
    money,
    percent,
} from '@/constants/creatorBonuses';
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

export default function ThreeProgrammes({ className = '' }) {
    return (
        <div className={className}>
            <LedgerFrame>
                <LedgerRow
                    title="Founder bonus"
                    line={`First ${FOUNDER.seats} creators to earn ${money(FOUNDER.qualifyingNet)} net in ${FOUNDER.windowDays} days. Founders then earn ${percent(FOUNDER.monthlyRate)} on top of monthly earnings, up to ${money(FOUNDER.monthlyCap)} a month.`}
                    figure={percent(FOUNDER.monthlyRate)}
                    tag="monthly"
                />
                <LedgerRow
                    title="Fast start bonus"
                    line={`An extra ${percent(FAST_START.rate)} on everything you earn in your first ${FAST_START.windowDays} days, paid alongside your normal payout.`}
                    figure={percent(FAST_START.rate)}
                    tag={`${FAST_START.windowDays} days`}
                />
                <LedgerRow
                    title="Creator referrals"
                    line={`${money(REFERRAL.amount)} for every creator you bring, paid once they have earned ${money(REFERRAL.qualifyingGmv)}. Your link is in your dashboard from day one.`}
                    figure={money(REFERRAL.amount)}
                    tag="per creator"
                />
            </LedgerFrame>

            <Link
                href="/creators/founder-bonus"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70"
                style={{ textDecorationColor: ACCENT.bonus }}
            >
                How the founder bonus works
                <ArrowRight size={14} />
            </Link>
        </div>
    );
}
