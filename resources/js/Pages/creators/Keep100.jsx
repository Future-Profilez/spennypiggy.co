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

/**
 * Keep 100% — the pricing argument.
 *
 * ⚠️ NO SUPPORTER-FEE PERCENTAGE APPEARS ON THIS PAGE, including in the worked
 * example. The rate differs per payment method and per creator (bespoke
 * agreements), so any single figure is wrong for someone — the same rule
 * `home/PricingSection.jsx` follows. The example shows the two numbers that ARE
 * fixed: what you list, and what you receive.
 */
export default function Keep100() {
    const accent = ACCENT.earn;
    const title = 'Keep 100% of what you list — Spenny Piggy for creators';
    const description = `No revenue cut. The price you list is the amount that reaches you, supporters cover the platform fee at checkout, and payouts run weekly. ${SUBSCRIPTION_COPY.promise}.`;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/keep-100" />
                <meta name="description" content={description} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content="https://spennypiggy.co/creators/keep-100"
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content="/siteicon.png" />
            </Head>

            <Guest>
                <AdPage>
                    {/* Hero. The signature is the worked example: three cells
                        where the first and the last are the same number. That
                        equality IS the argument, so it is the hero rather than
                        an illustration further down. */}
                    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-16">
                        <div>
                            <Eyebrow accent={accent}>Pricing</Eyebrow>

                            <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                                You keep
                                <br />
                                <span className="text-gradient-wishlist">
                                    100%
                                </span>{' '}
                                of what
                                <br />
                                you list.
                            </h1>

                            <p className="mb-9 mt-7 max-w-lg text-base leading-relaxed text-gray-300 md:text-xl">
                                There is no revenue cut. Supporters cover the
                                platform fee at checkout and see their full total
                                before they pay, so the number you set is the
                                number that reaches your bank.
                            </p>

                            <StartSelling promise={promise} />
                        </div>

                        <div className="grid gap-3">
                            <StatCell
                                figure="£20.00"
                                label="You list"
                                note="The price you choose, in your own currency."
                                className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                            />
                            <StatCell
                                figure="Their total"
                                label="Supporter pays"
                                note="Shown in full at checkout, before they pay. It varies by payment method."
                                className="rounded-box border-2 border-white/15 bg-white/[0.04]"
                            />
                            {/* The one filled block on the page — it is the
                                line the whole argument lands on. */}
                            <div
                                className="rounded-box border-2 border-black"
                                style={{ backgroundColor: accent }}
                            >
                                <StatCell
                                    figure="£20.00"
                                    label="You receive"
                                    note="Every penny of what you listed."
                                    className="[&>div:first-child]:text-black [&>div:nth-child(2)]:text-black/60 [&>p]:text-black/80"
                                />
                            </div>
                        </div>
                    </div>

                    {/* What never comes out */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="What never comes out"
                            accent={accent}
                            lead="The creator subscription is the only thing you ever pay us, and it does not start until you have made a sale."
                        >
                            One charge, and{' '}
                            <span className="text-gradient-wishlist">
                                only after you sell
                            </span>
                        </SectionHead>

                        <LedgerFrame className="mt-10">
                            <LedgerRow
                                title="Revenue cut"
                                line="We do not take a percentage of your listed price. Not on your first sale, not on your thousandth."
                                figure="£0"
                            />
                            <LedgerRow
                                title="Listing fees"
                                line="List as much as you like across all seven ways to earn."
                                figure="£0"
                            />
                            <LedgerRow
                                title="Payout fees"
                                line="Weekly payout runs to your own bank account through Stripe."
                                figure="£0"
                            />
                            <LedgerRow
                                title="Earning caps"
                                line="Nothing throttles what you can take in a week or a month."
                                figure="None"
                            />
                            <LedgerRow
                                title="Creator subscription"
                                line={`Charged monthly, starting after your first sale. ${SUBSCRIPTION_COPY.reassurance}`}
                                figure={PRICE_FORMATTED}
                                tag="+ VAT / mo"
                            />
                        </LedgerFrame>
                    </div>

                    {/* And it holds up */}
                    <div className="mt-20 md:mt-28">
                        <SectionHead
                            eyebrow="And it holds up"
                            accent={ACCENT.safe}
                            lead="Every payment here is tied to a platform feature and carries the delivery record a card issuer asks for. That is what keeps payouts arriving."
                        >
                            Keeping all of it is no use{' '}
                            <span className="text-gradient-wishlist">
                                if the account closes
                            </span>
                        </SectionHead>

                        <ul className="mt-10 grid gap-3 md:grid-cols-2">
                            {[
                                'Payments tied to platform features',
                                'Dispute evidence gathered for you',
                                'Delivery records on every transaction',
                                'Weekly payouts, VAT released alongside',
                            ].map((item) => (
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
                            className="mt-6 inline-flex items-center gap-2 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white underline decoration-2 underline-offset-4 hover:opacity-70 min-h-[44px]"
                            style={{ textDecorationColor: ACCENT.safe }}
                        >
                            Why accounts stay safe
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Close */}
                    <div className="mt-20 text-center md:mt-28">
                        <h2 className="font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            List something.{' '}
                            <span className="text-gradient-wishlist">
                                Keep all of it.
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
