import { Head, Link, usePage } from '@inertiajs/react';
import HoldsUpBlock, { HOLDS_UP } from './components/HoldsUpBlock';
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
import { feeIsAllIn, feeRateLabel } from '@/lib/fees';

/**
 * Keep 100% — the pricing argument.
 *
 * 🚨 THE SUPPORTER RATE IS ON THIS PAGE NOW, AND IT IS READ FROM THE SERVER
 * (11 Sep 2026). The note that used to sit here — "no supporter-fee percentage
 * appears on this page, because the rate differs per payment method and per
 * creator" — described the stacked legacy model, where there was no single
 * figure to state. Under all-in there is one, the client's §16 puts it in the
 * headline, and a page called "Keep 100%" that will not say what the other
 * side pays is the one page where withholding it reads worst.
 *
 * 🚨 NEVER TYPED — `feeRateLabel()` reads the shared `fees` prop, which comes
 * from `App\Services\Pricing\FeeModel`, the class the checkout prices from.
 *
 * ⚠️ IT IS THE STANDARD CARD RATE, THE MOST ANYBODY PAYS. Pay by Bank is
 * cheaper and a bespoke deal is cheaper again, so this figure can only
 * overstate our own fee — the only safe direction on a pricing page.
 */
export default function Keep100() {
    const page = usePage();
    const allIn = feeIsAllIn(page);
    const rate = feeRateLabel(page);
    const accent = ACCENT.earn;
    const title = 'Keep 100% of what you list — Spenny Piggy for creators';
    const description = allIn
        ? `No revenue cut. The price you list is the amount that reaches you, supporters pay ${rate} all-in with payment processing included, and payouts run weekly. ${SUBSCRIPTION_COPY.promise}.`
        : `No revenue cut. The price you list is the amount that reaches you, supporters cover the platform fee at checkout, and payouts run weekly. ${SUBSCRIPTION_COPY.promise}.`;
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
                                There is no revenue cut.{' '}
                                {allIn
                                    ? `Supporters pay your price plus ${rate}, all-in — the payment processing is inside that, and nothing is added afterwards.`
                                    : 'Supporters cover the platform fee at checkout.'}{' '}
                                They see their full total before they pay, so
                                the number you set is the number that reaches
                                your bank.
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
                            {/* 🚨 A RATE, NOT A RECOMPUTED TOTAL. The middle cell
                                read "Their total" — a placeholder, because under
                                the legacy model there was no single figure. It
                                states the rate now rather than multiplying the
                                £20 out in JavaScript: the engine's gross-up
                                rounds UP (a £100 listing charges £112.01, not
                                £112.00), so a total computed here would
                                understate the charge by pennies on some prices,
                                on the page whose whole claim is that our numbers
                                match the checkout. */}
                            <StatCell
                                figure={allIn ? `+${rate}` : 'Their total'}
                                label="Supporter pays"
                                note={
                                    allIn
                                        ? 'All-in, on card. Payment processing included, nothing added after. Pay by Bank is lower. Shown in full at checkout before they pay.'
                                        : 'Shown in full at checkout, before they pay. It varies by payment method.'
                                }
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
                            {/* 🚨 THE £1 ADMINISTRATION FEE WAS RETIRED ON
                                11 Sep 2026 and the supporter fee absorbed the
                                processing with it. Stated as a row rather than
                                left out, because "what never comes out" is the
                                section's subject and a reader arriving from an
                                older article is looking for exactly this. */}
                            <LedgerRow
                                title="Separate processing fee"
                                line="Card processing comes out of the supporter's all-in fee. There is no per-transaction charge added on top of it, and no administration fee."
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
                            eyebrow={HOLDS_UP.eyebrow}
                            accent={ACCENT.safe}
                            lead={HOLDS_UP.lead}
                        >
                            Keeping all of it is no use{' '}
                            <span className="text-gradient-wishlist">
                                if the account closes
                            </span>
                        </SectionHead>

                        {/* ⚠️ The body lives in `components/HoldsUpBlock` so the
                            vs pages can reuse it VERBATIM, which is what spec
                            v4.3 §3a asks for. Two copies of this paragraph are
                            two paragraphs that drift. */}
                        <HoldsUpBlock className="mt-10" />
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
