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

            {/*
             * ⚠️ COLUMNS, NOT A 2×2 GRID. As a grid the row height is the taller
             * cell, so the short "What you are charged" left ~180px of dead
             * space under it before the next row began — a hole in the middle of
             * the page's densest section. Two independent columns let each block
             * follow the one above it.
             */}
            <div className="mt-8 md:columns-2 md:gap-10 [&>*]:break-inside-avoid">
                <Block title="What you are charged">
                    Three rails, three rates — stablecoin, Pay by Bank, card —
                    plus one flat fee, all on this page. No withdrawal fees, no
                    instant-payout fees, no currency fees, no charges that only
                    appear on a help article. The supporter fee is not a cut of
                    your money: you always receive the price you list.
                </Block>

                {/*
                 * 🚨 THE SAME CLAIMS, SET AS THE LIST THEY ALREADY WERE. This
                 * was ONE 100-word sentence enumerating nine separate things
                 * behind commas and dashes — the densest block on the page, and
                 * the one making the argument the whole page turns on. Nobody
                 * reads a nine-item list written as prose; they skim it and
                 * take away "words". Not a word of the claim changed, only its
                 * shape.
                 *
                 * ⚠️ The two halves are deliberately separate: the first is what
                 * every competitor on these pages also sells, the second is what
                 * none of them do. Merged into one list that distinction — which
                 * IS the argument — disappears.
                 */}
                <Block title="What it pays for">
                    <p>
                        A wishlist app runs a wishlist. A tip page runs a tip
                        page. Spenny Piggy runs all of it on one profile:
                    </p>
                    <List
                        items={[
                            'Exclusive content, goals and paid requests',
                            'A shop, recurring content and memberships',
                            'A bio link that sells, and public discovery',
                        ]}
                    />
                    <p>
                        And underneath that, the things nobody else on this page
                        offers:
                    </p>
                    <List
                        accent
                        items={[
                            'A person reviewing every payment before it is paid out',
                            'A delivery record and dispute evidence on every sale',
                            'Automatic refund handling on requests',
                            'The content hosting and enhanced security a payment provider requires of a platform like this',
                            'Weekly payouts from a registered business',
                            'Real people on live chat when money is on the line',
                        ]}
                    />
                    <p>
                        That is heavier infrastructure than a tip jar, and the
                        fee is what runs it.
                    </p>
                </Block>

                <Block title="And it pays you back">
                    {percent(FAST_START.rate)} extra on everything in your first{' '}
                    {FAST_START.windowDays} days. {percent(FOUNDER.monthlyRate)}{' '}
                    extra every month for founders, up to{' '}
                    {money(FOUNDER.monthlyCap)} a month.{' '}
                    {money(REFERRAL.amount)} for every creator you refer, paid
                    once they have earned {money(REFERRAL.qualifyingGmv)}. And
                    further bonuses at our discretion through the year — we
                    would rather hand fee back to creators who are earning than
                    to anyone else.
                </Block>

                <Block title="Who is behind it">
                    Spenny Piggy is run by a US-registered business with
                    UK-based management, approved by its payment provider under
                    enhanced compliance requirements. Payouts come from that
                    business, to your own bank account, every week.
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

/**
 * ⚠️ A LIST INSIDE A PARAGRAPH, so the sentences either side still read as one
 * argument rather than as three orphaned blocks. `accent` marks the half that is
 * ours alone — the only thing on this page that no competitor row can match.
 */
function List({ items, accent = false }) {
    return (
        <ul className="grid gap-1.5">
            {items.map((item) => (
                <li
                    key={item}
                    className="flex gap-2.5 text-[15px] leading-[1.5] text-gray-300"
                >
                    <span
                        aria-hidden="true"
                        className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full"
                        style={{
                            backgroundColor: accent
                                ? '#05EFB8'
                                : 'rgba(255,255,255,0.35)',
                        }}
                    />
                    {item}
                </li>
            ))}
        </ul>
    );
}

/**
 * ⚠️ THE BODY IS A `<div>`, NOT A `<p>`. One of these blocks carries a `<ul>`,
 * and a list inside a paragraph is invalid DOM — the browser silently CLOSES the
 * paragraph before the list and reopens one after, so the block renders as three
 * elements with the paragraph's own spacing between them and the layout drifts
 * for a reason nothing in the source shows. React reports it as a
 * `validateDOMNesting` warning, which is easy to scroll past; the visual result
 * is not. The prose blocks wrap their own text in `<p>` so the semantics survive.
 */
function Block({ title, children }) {
    return (
        <div className="mb-8 last:mb-0">
            <h3 className="font-gulfs text-[15px] uppercase tracking-[0.1em] text-white">
                {title}
            </h3>
            <div className="mt-3 grid gap-3 text-base leading-[1.6] text-gray-300">
                {children}
            </div>
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
