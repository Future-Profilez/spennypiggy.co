import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from './components/AdPage';
import {
    ACCENT,
    Eyebrow,
    LedgerFrame,
    LedgerRow,
    SectionHead,
    StartSelling,
    StatCell,
} from './components/Ledger';
import { ArrowRight } from 'lucide-react';

import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from '@/constants/creatorSubscription';
import {
    FAST_START,
    FOUNDER,
    REFERRAL,
    money,
    percent,
} from '@/constants/creatorBonuses';

/**
 * Founder Bonus — the bonus argument, and the only page carrying the violet
 * accent.
 *
 * ⚠️ Every figure comes from `creatorBonuses.js`, which mirrors
 * `config/founder_bonus.php`. A seat count or threshold changed in config
 * without changing the constants file puts a wrong number in a live advert.
 *
 * ⚠️ These are QUALIFYING THRESHOLDS, never a promise of earnings. "Limited
 * availability · no assured earnings · terms apply" stays on the page, and the
 * rules sit at the same visual weight as the rewards rather than in small print
 * underneath them.
 */
export default function FounderBonus() {
    const accent = ACCENT.bonus;
    const title = `Founder bonus — ${percent(FOUNDER.monthlyRate)} on top for the first ${FOUNDER.seats} creators`;
    const description = `The first ${FOUNDER.seats} creators to earn ${money(FOUNDER.qualifyingNet)} net in their first ${FOUNDER.windowDays} days become founders, then earn ${percent(FOUNDER.monthlyRate)} on top of monthly earnings up to ${money(FOUNDER.monthlyCap)} a month. Limited seats, no assured earnings, terms apply.`;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/founder-bonus" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/founder-bonus"
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content="/siteicon.png" />
            </Head>

            <Guest>
                <AdPage>
                    {/* Hero */}
                    <div className="max-w-3xl">
                        <Eyebrow accent={accent}>
                            {FOUNDER.seats} seats, then it closes
                        </Eyebrow>

                        <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                            Founder bonus
                            <br />
                            for the{' '}
                            <span className="text-gradient-wishlist">
                                first {FOUNDER.seats}.
                            </span>
                        </h1>

                        <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                            Earn {money(FOUNDER.qualifyingNet)} net in your first{' '}
                            {FOUNDER.windowDays} days and you become a founder —
                            then {percent(FOUNDER.monthlyRate)} is added on top
                            of what you earn each month, up to{' '}
                            {money(FOUNDER.monthlyCap)}.
                        </p>

                        <StartSelling promise={promise} />
                    </div>

                    {/* The three numbers */}
                    <div className="mt-16 grid gap-4 md:grid-cols-3 md:gap-5">
                        <StatCell
                            figure={String(FOUNDER.seats)}
                            label="Founder seats"
                            note="Across the whole platform. Once they are filled, the programme closes."
                            accent={accent}
                            className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                        />
                        <StatCell
                            figure={money(FOUNDER.qualifyingNet)}
                            label={`Net, in ${FOUNDER.windowDays} days`}
                            note="What you take home, not what supporters paid."
                            accent={accent}
                            className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                        />
                        {/* ⚠️ BLACK on a filled brand block, not white. Measured,
                            white on this violet is ~4.6:1 — fine for the big
                            figure, under AA for the label and note beneath it. */}
                        <div
                            className="rounded-box border-2 border-black"
                            style={{ backgroundColor: accent }}
                        >
                            <StatCell
                                figure={percent(FOUNDER.monthlyRate)}
                                label="Added each month"
                                note={`On your monthly earnings, up to ${money(FOUNDER.monthlyCap)}.`}
                                className="[&>div:first-child]:text-black [&>div:nth-child(2)]:text-black/60 [&>p]:text-black/80"
                            />
                        </div>
                    </div>

                    {/* What founders get */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead eyebrow="What founders get" accent={accent}>
                            Paid on top,{' '}
                            <span className="text-gradient-wishlist">
                                every month
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
                            <LedgerRow
                                title="Monthly bonus"
                                line={`${percent(FOUNDER.monthlyRate)} added on top of your monthly earnings, capped at ${money(FOUNDER.monthlyCap)} a month, paid out with your normal weekly payout.`}
                                figure={percent(FOUNDER.monthlyRate)}
                                tag="monthly"
                            />
                            <LedgerRow
                                title="Founder badge"
                                line="On your public profile, and on every card, leaderboard and search result you appear in."
                                tag="permanent"
                            />
                            <LedgerRow
                                title="Priority access"
                                line="New monetisation tools reach founders first, as they ship."
                                tag="ongoing"
                            />
                            <LedgerRow
                                title="Nothing to claim"
                                line="Qualification is calculated from your own earnings. There is no form and no application."
                                tag="automatic"
                            />
                        </LedgerFrame>
                    </div>

                    {/* Key rules — same weight as the rewards, deliberately */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Key rules"
                            accent={accent}
                            lead="Qualifying is on you, and nothing here guarantees an income. These are the terms in full — they are on this page rather than under it."
                        >
                            A threshold,{' '}
                            <span className="text-gradient-wishlist">
                                not a promise
                            </span>
                        </SectionHead>

                        <ul className="mt-10 grid gap-3 md:grid-cols-2">
                            {[
                                `Limited availability — ${FOUNDER.seats} seats across the whole platform.`,
                                `The ${FOUNDER.windowDays}-day window starts when your payouts are connected, not when you sign up.`,
                                'Refunded and disputed sales do not count toward the threshold.',
                                'Earnings are never assured. Terms apply.',
                            ].map((rule) => (
                                <li
                                    key={rule}
                                    className="rounded-box border-2 border-white/15 bg-white/[0.04] px-5 py-4 text-base text-white md:text-lg"
                                >
                                    {rule}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* The other two */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Two more paid on top"
                            accent={accent}
                            lead="Both of these stack with the founder bonus, and with each other."
                        >
                            You do not have to be{' '}
                            <span className="text-gradient-wishlist">
                                a founder
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
                            <LedgerRow
                                title="Fast start bonus"
                                line={`An extra ${percent(FAST_START.rate)} on everything you earn in your first ${FAST_START.windowDays} days, paid alongside your normal payout. No application, no claim form.`}
                                figure={percent(FAST_START.rate)}
                                tag={`${FAST_START.windowDays} days`}
                            />
                            <LedgerRow
                                title="Creator referrals"
                                line={`${money(REFERRAL.amount)} for every creator you bring, paid once they have earned ${money(REFERRAL.qualifyingGmv)}. Your referral link is in your dashboard from the day you join.`}
                                figure={money(REFERRAL.amount)}
                                tag="per creator"
                            />
                        </LedgerFrame>

                        <Link
                            href="/creators/features"
                            className="mt-6 inline-flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70 min-h-[44px]"
                            style={{ textDecorationColor: accent }}
                        >
                            See the seven ways to earn
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Close */}
                    <div className="mt-20 text-center md:mt-28">
                        <h2 className="font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Seats go once.{' '}
                            <span className="text-gradient-wishlist">
                                Start now.
                            </span>
                        </h2>
                        <StartSelling
                            promise={promise}
                            align="center"
                            className="mt-8"
                        />
                    </div>
                </AdPage>
            </Guest>
        </>
    );
}
