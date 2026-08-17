import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from './components/AdPage';
import {
    ACCENT,
    Eyebrow,
    LedgerFrame,
    LedgerRow,
    LedgerTotal,
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
 * The creators overview — the Final URL every Google Ads campaign points at.
 *
 * ⚠️ STRIPE-FACING SURFACE. The version this replaces sold "Wishlist Gifting",
 * "Bills & Contributions — help with real-world costs" and "Supporters spend
 * more on gifts, tasks and bills" — wording `App\Rules\NoExpenseOrBrandName`
 * REJECTS on a real listing, so the advert was coaching creators to list things
 * the platform refuses.
 *
 * ⚠️ Removed and not to be reinstated: "Spenny Piggy absorbs the loss — not the
 * creator" and "Creators are never debited". The second is not true —
 * `LedgerRules::payable()`'s refund/dispute adjustment deducts from the creator.
 *
 * ⚠️ This page carries ALL THREE accents, once each, as its section markers — it
 * is the only one that does. The five argument pages carry one apiece, which is
 * what makes them look like different pages to someone arriving from a different
 * advert.
 */

const WAYS = [
    {
        mark: '🔓',
        title: 'Exclusive content',
        line: 'Photos, videos, guides and bundles that unlock on payment.',
        tag: 'one-off',
    },
    {
        mark: '🎯',
        title: 'Content goals',
        line: 'One piece of content, sold toward a target everyone can see.',
        tag: 'one-off',
    },
    {
        mark: '💖',
        title: 'Piggy Bank',
        line: 'A one-off content purchase, at an amount they pick.',
        tag: 'one-off',
    },
    {
        mark: '✅',
        title: 'Paid requests',
        line: 'Custom work, paid up front and held until you deliver.',
        tag: 'one-off',
    },
    {
        mark: '🛍️',
        title: 'Your shop',
        line: 'Digital files, prints and merch on your own storefront.',
        tag: 'one-off',
    },
    {
        mark: '🔁',
        title: 'Recurring content',
        line: 'One content stream on a schedule, charged every month.',
        tag: 'monthly',
    },
    {
        mark: '💎',
        title: 'Memberships',
        line: 'Tiers, perks and member-only posts for your closest supporters.',
        tag: 'monthly',
    },
];

const REASONS = [
    {
        title: 'You keep 100%',
        line: 'No revenue cut. The price you list is the amount that reaches you — supporters cover the platform fee at checkout, and they see their full total before they pay.',
        href: '/creators/keep-100',
        cta: 'How the pricing works',
        accent: ACCENT.earn,
    },
    {
        title: 'Built to stay online',
        line: 'Payment accounts get closed when money arrives with no explanation. Every payment here is tied to a platform feature, with the usage rules and activity logs a card issuer expects.',
        href: '/creators/stripe-safe',
        cta: 'Why accounts stay safe',
        accent: ACCENT.safe,
    },
    {
        // ⚠️ The creator is the MERCHANT OF RECORD — disputes and refunds are
        // theirs to decide, and the platform does not answer the card issuer for
        // them. This card used to say "disputes are ours"; see Disputes.jsx.
        title: 'Never answer empty-handed',
        line: 'You are the merchant of record, so a dispute is your call. Every sale records what was sold, that it was delivered, that it was opened and what the buyer agreed to — so you answer with evidence instead of memory.',
        href: '/creators/disputes',
        cta: 'What we capture',
        accent: ACCENT.safe,
    },
    {
        title: 'Real people, on chat',
        line: 'Live chat support when money is on the line — not a form and a three-day wait.',
        href: null,
        cta: null,
        accent: ACCENT.bonus,
    },
];

export default function Index() {
    const title = 'Sell your content and keep 100% — Spenny Piggy for creators';
    const description = `Seven ways to get paid on one profile, weekly payouts, and dispute evidence gathered for you. You keep 100% of your listed price. ${SUBSCRIPTION_COPY.promise}.`;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators"
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
                        <Eyebrow accent={ACCENT.earn}>For creators</Eyebrow>

                        <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                            Sell your content.
                            <br />
                            <span className="text-gradient-wishlist">
                                Keep all of it.
                            </span>
                        </h1>

                        <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                            Seven ways to get paid on one profile, payouts every
                            week, and every sale documented — so if a payment is
                            ever queried, you answer it with evidence.
                        </p>

                        <StartSelling promise={promise} />
                    </div>

                    {/* The three figures the page rests on */}
                    <div className="mt-16 grid gap-4 md:grid-cols-3 md:gap-5">
                        <StatCell
                            figure="100%"
                            label="Of your listed price"
                            note="No revenue cut. Supporters cover the platform fee at checkout."
                            accent={ACCENT.earn}
                            className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                        />
                        <StatCell
                            figure="Weekly"
                            label="Payout runs"
                            note="Straight to your own bank account through Stripe."
                            accent={ACCENT.safe}
                            className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                        />
                        <StatCell
                            figure="7"
                            label="Ways to get paid"
                            note="Five a supporter buys once, two they pay every month."
                            accent={ACCENT.bonus}
                            className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                        />
                    </div>

                    {/* Ways to earn */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead eyebrow="Ways to earn" accent={ACCENT.earn}>
                            One profile,{' '}
                            <span className="text-gradient-wishlist">
                                seven ways to be paid
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
                            {WAYS.map((way) => (
                                <LedgerRow
                                    key={way.title}
                                    mark={way.mark}
                                    title={way.title}
                                    line={way.line}
                                    tag={way.tag}
                                    accent={ACCENT.earn}
                                />
                            ))}
                            <LedgerTotal
                                label="What reaches you"
                                note="Supporters cover the fees at checkout."
                                figure="100%"
                            />
                        </LedgerFrame>

                        <Link
                            href="/creators/features"
                            className="mt-6 inline-flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70 min-h-[44px]"
                            style={{ textDecorationColor: ACCENT.earn }}
                        >
                            See all seven in detail
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Why creators choose this */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Why creators choose this"
                            accent={ACCENT.safe}
                        >
                            Paid properly, and{' '}
                            <span className="text-gradient-wishlist">
                                still here next year
                            </span>
                        </SectionHead>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
                            {REASONS.map((reason) => (
                                <div
                                    key={reason.title}
                                    className="flex flex-col rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-8"
                                >
                                    <span
                                        className="mb-5 block h-[5px] w-10 rounded-full"
                                        style={{
                                            backgroundColor: reason.accent,
                                        }}
                                    />
                                    <h3 className="mb-3 font-gulfs text-lg uppercase leading-tight tracking-wide text-white md:text-xl">
                                        {reason.title}
                                    </h3>
                                    <p className="text-base leading-relaxed text-gray-300">
                                        {reason.line}
                                    </p>
                                    {reason.href && (
                                        <Link
                                            href={reason.href}
                                            className="mt-6 inline-flex w-fit items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70 min-h-[44px]"
                                            style={{
                                                textDecorationColor:
                                                    reason.accent,
                                            }}
                                        >
                                            {reason.cta}
                                            <ArrowRight size={14} />
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* The problem */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="The problem"
                            accent={ACCENT.safe}
                            lead="A transfer with no explanation behind it is the thing that gets an account reviewed, and then closed. One report is enough."
                        >
                            Why creators lose money{' '}
                            <span className="text-gradient-wishlist">
                                on payment apps
                            </span>
                        </SectionHead>

                        <ul className="mt-10 grid gap-3 md:grid-cols-2">
                            {[
                                [
                                    'No delivery tracking',
                                    'Nothing proves the buyer received anything',
                                ],
                                [
                                    'No service context',
                                    'The charge does not say what it was for',
                                ],
                                [
                                    'No platform protection',
                                    'You answer the card issuer yourself',
                                ],
                                [
                                    'One report freezes everything',
                                    'Including the money already earned',
                                ],
                            ].map(([head, sub]) => (
                                <li
                                    key={head}
                                    className="rounded-box border-2 border-white/15 bg-white/[0.04] px-5 py-4"
                                >
                                    <div className="font-gulfs text-base uppercase tracking-wide text-white md:text-lg">
                                        {head}
                                    </div>
                                    <div className="mt-1.5 text-sm text-white/60 md:text-base">
                                        {sub}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Bonuses */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Paid on top"
                            accent={ACCENT.bonus}
                            lead="Each one is a qualifying threshold, not a promise. Earnings are never assured and terms apply."
                        >
                            Three programmes{' '}
                            <span className="text-gradient-wishlist">
                                that stack
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
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
                                line={`${money(REFERRAL.amount)} for every creator you bring who starts selling. Your link is in your dashboard from day one.`}
                                figure={money(REFERRAL.amount)}
                                tag="per creator"
                            />
                        </LedgerFrame>

                        <Link
                            href="/creators/founder-bonus"
                            className="mt-6 inline-flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70 min-h-[44px]"
                            style={{ textDecorationColor: ACCENT.bonus }}
                        >
                            How the founder bonus works
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Close */}
                    <div className="mt-20 text-center md:mt-28">
                        <h2 className="font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Start selling{' '}
                            <span className="text-gradient-wishlist">today</span>
                        </h2>
                        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-gray-300 md:text-xl">
                            Listing is free. You are not charged anything until
                            you have made a sale.
                        </p>
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
