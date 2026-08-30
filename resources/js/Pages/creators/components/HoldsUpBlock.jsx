import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { ACCENT } from './Ledger';

/**
 * "Keeping all of it is no use if the account closes" — the holds-up block.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, §3a: *"Why every
 * payment here holds up — reuse the 'Keeping all of it is no use if the account
 * closes' block from /creators/keep-100 verbatim."* It was listed in the fixed
 * running order of every vs page and had never been built there.
 *
 * 🚨 ONE DEFINITION, LIFTED OUT OF `Keep100.jsx` RATHER THAN COPIED INTO THE VS
 * TEMPLATE. The spec's word is "verbatim", and two copies of a paragraph are two
 * paragraphs that drift the first time one is edited — which is the whole reason
 * that instruction exists. `Keep100` imports this now; the words live here.
 *
 * ⚠️ The HEAD is drawn by the caller. The copy is fixed, the head STYLE is the
 * page's own — `/creators/keep-100` uses the stacked `SectionHead`, the vs pages
 * use `SectionHeadSplit` on the twelve-column spine. Same rule as `headless` on
 * `FeatureMatrix` / `FeeBlock` / `WhyTheFee`.
 */
export const HOLDS_UP = {
    eyebrow: 'And it holds up',
    lead: 'Every payment here is tied to a platform feature and carries the delivery record a card issuer asks for. That is what keeps payouts arriving.',
    items: [
        'Payments tied to platform features',
        'Dispute evidence gathered for you',
        'Delivery records on every transaction',
        'Weekly payouts, VAT released alongside',
    ],
};

export default function HoldsUpBlock({ className = '' }) {
    return (
        <div className={className}>
            <ul className="grid gap-3 md:grid-cols-2">
                {HOLDS_UP.items.map((item) => (
                    <li
                        key={item}
                        className="rounded-box border-2 border-white/15 bg-white/[0.04] px-5 py-4 text-base text-white md:text-lg"
                    >
                        {item}
                    </li>
                ))}
            </ul>

            <Link
                href="/creators/stripe-safe"
                className="mt-6 inline-flex min-h-[44px] items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70"
                style={{ textDecorationColor: ACCENT.safe }}
            >
                Why accounts stay safe
                <ArrowRight size={14} />
            </Link>
        </div>
    );
}
