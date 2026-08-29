import {
    FAST_START,
    FOUNDER,
    REFERRAL,
    money,
    percent,
} from '@/constants/creatorBonuses';
import { Eyebrow } from './Ledger';

/**
 * Component C — "Why the fee, and how to bring it down".
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 6. Rendered
 * verbatim on every /creators/vs/* page and on /creators/wishlist.
 *
 * 🚨 EVERY FIGURE IS IMPORTED FROM `creatorBonuses.js`, NEVER TYPED HERE. These
 * pages are Google Ads destinations, so a wrong number is a wrong number in an
 * advert. Same rule the rest of the /creators pages already follow.
 *
 * ⚠️ THE REFERRAL REWARD IS NEVER SHOWN WITHOUT ITS THRESHOLD. The £50 is paid
 * once the referred creator has earned £1,000 — quoting the reward alone sets a
 * creator up to share their link, watch someone sign up, and get nothing. The
 * spec's appendix corrects exactly this wording across the existing pages.
 *
 * ⚠️ THESE ARE QUALIFYING THRESHOLDS, NOT PROMISED EARNINGS, and the copy has
 * to keep reading that way.
 */
export default function WhyTheFee({ accent, headless = false }) {
    return (
        <section>
            {/* ⚠️ See `FeatureMatrix` for why `headless` exists. */}
            {!headless && (
                <>
                    <Eyebrow accent={accent}>Why the fee</Eyebrow>

                    <h2 className="mt-4 font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                        Why our fee is what it is
                    </h2>
                </>
            )}

            <div className="mt-8 grid gap-6 md:grid-cols-2 md:gap-8">
                <Block title="What you are charged">
                    Three rails, three rates — stablecoin, Pay by Bank, card —
                    plus one flat fee, all on this page. No withdrawal fees, no
                    instant-payout fees, no currency fees, no charges that only
                    appear on a help article. The supporter fee is not a cut of
                    your money: you always receive the price you list.
                </Block>

                <Block title="What it pays for">
                    A wishlist app runs a wishlist. A tip page runs a tip page.
                    Spenny Piggy runs all of it on one profile — exclusive
                    content, goals, requests, a shop, recurring content,
                    memberships, a bio link that sells and public discovery — and
                    underneath that, the things nobody else on this page offers:
                    a person reviewing every payment before it is paid out, a
                    delivery record and dispute evidence on every sale, automatic
                    refund handling on requests, the content hosting and enhanced
                    security a payment provider requires of a platform like this,
                    weekly payouts from a registered business, and real people on
                    live chat when money is on the line. That is heavier
                    infrastructure than a tip jar, and the fee is what runs it.
                </Block>

                <Block title="And it pays you back">
                    {percent(FAST_START.rate)} extra on everything in your first{' '}
                    {FAST_START.windowDays} days. {percent(FOUNDER.monthlyRate)}{' '}
                    extra every month for founders, up to{' '}
                    {money(FOUNDER.monthlyCap)} a month.{' '}
                    {money(REFERRAL.amount)} for every creator you refer, paid
                    once they have earned {money(REFERRAL.qualifyingGmv)}. And
                    further bonuses at our discretion through the year — we would
                    rather hand fee back to creators who are earning than to
                    anyone else.
                </Block>

                <Block title="Who is behind it">
                    Spenny Piggy is run by a US-registered business with UK-based
                    management, approved by its payment provider under enhanced
                    compliance requirements. Payouts come from that business, to
                    your own bank account, every week.
                </Block>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
                <Card
                    heading="Pay by Bank"
                    body="Supporters who pay straight from their bank pay a lower fee than card, because bank payments cost us less to process. Available in the UK, EU and US. Recommended on higher-value payments."
                />
                <Card
                    heading="Stablecoin Tips — coming soon"
                    /*
                     * ⚠️ NO TIMING, NO NETWORK, NO SETTLEMENT SPEED. "Instant",
                     * "immediate" and "seconds" are banned outright on these
                     * surfaces — no settlement speed has been confirmed by
                     * anybody — and the provider is never named.
                     */
                    body="A straight tip in USDC, with the lowest fee of any rail. Nothing to unlock, nothing exchanged. Buttons are on your profile now and switch on the day the rail goes live."
                />
                <Card
                    heading="Volume pricing, case by case"
                    body="The three rates are base rates. Already earning, or about to? We agree bespoke supporter fees case by case to bring pricing in line with your volume. Drop us a chat — it takes one conversation."
                />
            </div>
        </section>
    );
}

function Block({ title, children }) {
    return (
        <div>
            <h3 className="font-gulfs text-[15px] uppercase tracking-[0.1em] text-white">
                {title}
            </h3>
            <p className="mt-3 text-base leading-[1.6] text-gray-300">
                {children}
            </p>
        </div>
    );
}

function Card({ heading, body }) {
    return (
        <div className="rounded-box-sm border border-white/15 px-5 py-5">
            <h4 className="font-gulfs text-[13px] uppercase tracking-[0.1em] text-white">
                {heading}
            </h4>
            <p className="mt-3 text-[15px] leading-[1.55] text-gray-300">
                {body}
            </p>
        </div>
    );
}
