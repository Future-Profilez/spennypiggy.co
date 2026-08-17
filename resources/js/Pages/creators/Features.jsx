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
import { ArrowRight, Check } from 'lucide-react';

import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from '@/constants/creatorSubscription';
import {
    FAST_START,
    FOUNDER,
    PRICE_LIMITS,
    REFERRAL,
    money,
    percent,
    price,
} from '@/constants/creatorBonuses';

/**
 * "7 ways to earn" — the detail page behind the paid-ads headline of the same
 * name, so the number in the advert and the number on this page are the same
 * seven products.
 *
 * ⚠️ THE SEVEN ARE THE LIVE PRODUCTS, under the same content-first titles the
 * home page's `WaysToGetPaid` uses. If a product is added or retired, both
 * surfaces change together — an advert promising seven against a page listing
 * six is the worst version of this page.
 *
 * ⚠️ Copy here is a STRIPE-FACING SURFACE and a Google Ads destination, so the
 * ban list applies in full: no gift, tip, donation, fundraising, bill, rent or
 * "help with costs" framing, and no brand names.
 *
 * ⚠️ Every figure is imported from `creatorBonuses.js` / `creatorSubscription.js`.
 * Nothing on this page is a retyped number.
 */

/** Paid once — the supporter buys, the transaction is finished. */
const ONE_OFF = [
    {
        mark: '🔓',
        title: 'Exclusive content',
        line: 'Photos, videos, guides, bundles. They pay, it unlocks.',
        detail: 'Upload the file, set a price, write one line about what it is. No account needed to buy, so nothing stands between a supporter and a purchase.',
        figure: `${price(PRICE_LIMITS.min)}–${price(PRICE_LIMITS.wish)}`,
        best: 'The fastest thing to list on day one',
    },
    {
        mark: '🎯',
        title: 'Content goals',
        line: 'One piece of content, sold toward a target everyone can see.',
        detail: 'Attach the content, set the target, share the link. Everyone who buys gets the same thing and moves the bar — the progress does the asking for you.',
        figure: `${price(PRICE_LIMITS.min)}–${price(PRICE_LIMITS.piggyPot)}`,
        best: 'New equipment, a shoot, a project with an end date',
    },
    {
        mark: '💖',
        title: 'Piggy Bank',
        line: 'A one-off content purchase, at an amount they pick.',
        detail: 'Nothing to set up — it is on your profile from the day you join. They choose what to pay and get your exclusive content back.',
        figure: `${price(PRICE_LIMITS.min)}–${price(PRICE_LIMITS.piggyBank)}`,
        best: 'Supporters who want to pay more than you asked',
    },
    {
        mark: '✅',
        title: 'Paid requests',
        line: 'Custom work, paid up front and held until you deliver.',
        detail: 'You set the price, the deadline and the rules, and you approve every request before it starts. The money sits in escrow until the work is handed over.',
        figure: `${price(PRICE_LIMITS.min)}–${price(PRICE_LIMITS.tasks)}`,
        best: 'Personalised work you would otherwise do over DMs',
    },
    {
        mark: '🛍️',
        title: 'Your shop',
        line: 'Digital files, prints and merch on your own storefront.',
        detail: 'List the product, set stock, add shipping if it is physical. Buyers get tracking on physical orders and an instant download on digital ones.',
        figure: `${price(PRICE_LIMITS.min)}–${price(PRICE_LIMITS.shop)}`,
        best: 'Anything you already sell somewhere else',
    },
];

/** Paid every month — the same supporter, charged again, until they stop. */
const RECURRING = [
    {
        mark: '🔁',
        title: 'Recurring content',
        line: 'One content stream on a schedule.',
        detail: 'One price, one schedule, no tiers to design. They know what is coming and you know what is landing — the closest thing here to a salary.',
        figure: `${price(PRICE_LIMITS.min)}–${price(PRICE_LIMITS.bills)}`,
        best: 'Income you can forecast',
    },
    {
        mark: '💎',
        title: 'Memberships',
        line: 'Tiers, perks and member-only posts.',
        detail: 'Build the tiers, choose what is in each one, post for members. Your closest supporters pay every month for the version of you they cannot get free.',
        figure: `${price(PRICE_LIMITS.min)}–${price(PRICE_LIMITS.memberships)}`,
        best: 'Your most committed buyers',
    },
];

export default function Features() {
    const accent = ACCENT.earn;
    const title = '7 ways to earn as a creator — Spenny Piggy';
    const description = `Seven ways to get paid on one profile: exclusive content, content goals, Piggy Bank, paid requests, your shop, recurring content and memberships. You keep 100% of your listed price. ${SUBSCRIPTION_COPY.promise}.`;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/features" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/features"
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content="/siteicon.png" />
            </Head>

            <Guest>
                <AdPage>
                    {/* Hero — the ledger IS the hero. Seven rows and a total say
                        more than a headline about seven rows would. */}
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
                        <div>
                            <Eyebrow accent={accent}>
                                Seven ways to get paid
                            </Eyebrow>

                            <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                                Seven ways
                                <br />
                                to earn.
                                <br />
                                <span className="text-gradient-wishlist">
                                    One profile.
                                </span>
                            </h1>

                            <p className="mb-9 mt-7 max-w-lg text-base leading-relaxed text-gray-300 md:text-xl">
                                Five things a supporter buys once. Two they pay
                                for every month. Same profile, same checkout,
                                same weekly payout — and you keep 100% of the
                                price you list.
                            </p>

                            <StartSelling promise={promise} />
                        </div>

                        <LedgerFrame>
                            {ONE_OFF.map((w) => (
                                <LedgerRow
                                    key={w.title}
                                    mark={w.mark}
                                    title={w.title}
                                    line={w.line}
                                    figure={w.figure}
                                    tag="one-off"
                                    accent={accent}
                                />
                            ))}
                            {RECURRING.map((w) => (
                                <LedgerRow
                                    key={w.title}
                                    mark={w.mark}
                                    title={w.title}
                                    line={w.line}
                                    figure={`${w.figure} /mo`}
                                    tag="monthly"
                                    accent={accent}
                                />
                            ))}
                            <LedgerTotal
                                label="What reaches you"
                                note="Supporters cover the fees at checkout."
                                figure="100%"
                            />
                        </LedgerFrame>
                    </div>

                    {/* Each one, in full */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead eyebrow="In detail" accent={accent}>
                            What each one{' '}
                            <span className="text-gradient-wishlist">is</span>
                        </SectionHead>

                        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
                            {[...ONE_OFF, ...RECURRING].map((way, i) => {
                                const recurring = i >= ONE_OFF.length;
                                return (
                                    <div
                                        key={way.title}
                                        className="flex flex-col rounded-box border-2 border-black bg-white p-5 md:p-7"
                                    >
                                        <div className="mb-4 flex items-center gap-3">
                                            <div
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-box-sm border-2 border-black text-xl"
                                                style={{
                                                    backgroundColor: accent,
                                                }}
                                                aria-hidden="true"
                                            >
                                                {way.mark}
                                            </div>
                                            <h3 className="flex-1 font-gulfs text-lg uppercase leading-tight tracking-wide text-black md:text-xl">
                                                {way.title}
                                            </h3>
                                            <span className="shrink-0 font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/60">
                                                {recurring
                                                    ? 'monthly'
                                                    : 'one-off'}
                                            </span>
                                        </div>

                                        <p className="mb-5 text-base leading-relaxed text-black/80">
                                            {way.detail}
                                        </p>

                                        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t-2 border-black/10 pt-4">
                                            <span className="font-gulfs text-base uppercase tabular-nums text-black md:text-lg">
                                                {way.figure}
                                                {recurring ? ' /mo' : ''}
                                            </span>
                                            <span className="text-[13px] text-black/60">
                                                {way.best}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Seven is odd — the last cell carries the CTA
                                rather than a gap. */}
                            <div className="flex flex-col justify-center rounded-box border-2 border-white/15 bg-white/[0.04] p-6 md:p-8">
                                <h3 className="mb-4 font-gulfs text-2xl uppercase leading-[0.95] text-white md:text-3xl">
                                    Use one.{' '}
                                    <span className="text-gradient-wishlist">
                                        Use all seven.
                                    </span>
                                </h3>
                                <p className="mb-8 text-base leading-relaxed text-gray-300">
                                    They run side by side on one profile. Turn on
                                    what suits you now and add the rest whenever
                                    you like.
                                </p>
                                <StartSelling promise={promise} />
                            </div>
                        </div>
                    </div>

                    {/* What you keep */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead eyebrow="What you keep" accent={accent}>
                            The price you list is{' '}
                            <span className="text-gradient-wishlist">
                                the price you get
                            </span>
                        </SectionHead>

                        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
                            <StatCell
                                figure="100%"
                                label="Of your listed price"
                                note="Supporters cover the platform fee at checkout, and they see their full total before they pay."
                                accent={ACCENT.earn}
                                className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                            />
                            <StatCell
                                figure="Weekly"
                                label="Payout runs"
                                note="Straight to your own bank account through Stripe, with the VAT you collected released alongside it."
                                accent={ACCENT.safe}
                                className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                            />
                            <StatCell
                                figure={PRICE_FORMATTED}
                                label="A month, after your first sale"
                                note={`${SUBSCRIPTION_COPY.reassurance} Cancel any time.`}
                                accent={ACCENT.bonus}
                                className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                            />
                        </div>
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

                    {/* Safety */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="Why this stays online"
                            accent={ACCENT.safe}
                            lead="Payment accounts get closed when money arrives with no explanation. All seven of these attach the content or the service to the charge — which is exactly what a card issuer asks for when a payment is queried."
                        >
                            Every payment is tied to{' '}
                            <span className="text-gradient-wishlist">
                                something you delivered
                            </span>
                        </SectionHead>

                        <ul className="mt-10 grid gap-3 md:grid-cols-2">
                            {[
                                'A delivery record on every transaction',
                                'Time-stamped activity logs',
                                'Dispute evidence gathered for you',
                                'Clear usage and content rules, enforced',
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-4 rounded-box border-2 border-white/15 bg-white/[0.04] px-5 py-4 text-base text-white md:text-lg"
                                >
                                    <span
                                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-black"
                                        style={{
                                            backgroundColor: ACCENT.safe,
                                        }}
                                    >
                                        <Check size={14} strokeWidth={4} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Close */}
                    <div className="mt-20 text-center md:mt-28">
                        <h2 className="font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Pick one.{' '}
                            <span className="text-gradient-wishlist">
                                Start today.
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
