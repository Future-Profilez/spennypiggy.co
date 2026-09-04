import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from './components/AdPage';
import FeeBlock from './components/FeeBlock';
import WhyTheFee from './components/WhyTheFee';
import PillarCards from '@/Components/PillarCards';
import {
    ACCENT,
    Eyebrow,
    LedgerFrame,
    LedgerRow,
    LedgerTotal,
    SectionHead,
    SectionHeadSplit,
    StartSelling,
} from './components/Ledger';
import { MAX_PRICE_GBP, MIN_PRICE_GBP } from '@/lib/priceLimits';
import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from '@/constants/creatorSubscription';

/**
 * /creators/memberships — the recurring-revenue landing page.
 *
 * Client note, 4 Sep 2026: memberships are what separate this platform from a
 * gifting site, and the product had no page of its own — it was one card,
 * seventh of seven, on the home page and on `/creators`.
 *
 * 🚨 NOTHING ON THIS PAGE IS NEW PRODUCT. Every step is a step the membership
 * form actually has, and every benefit is a key in `config/rewards.php`. The
 * step names are the form's own words — a creator who signs up on the strength
 * of this page has to find the thing they read about, under the same name.
 *
 * ⚠️ THE ACCENT IS MINT AND ONLY MINT. `Ledger`'s accents encode which half of
 * the argument a page is making — mint is money coming in — and a page with
 * three accents has none.
 *
 * ⚠️ SSR. This page is inside the `ssr` route group, and `renderToString` is
 * synchronous: no lazy import, no `window` read at module scope. The model
 * below is `useState` with real defaults so the server render is a complete,
 * readable page rather than an empty frame waiting for hydration.
 */

/** The example the model opens on. A dozen members at fifteen pounds. */
const DEFAULT_MEMBERS = 12;
const DEFAULT_PRICE = 15;
const MONTHS = 12;

/*
 * The dial, in the house language.
 *
 * ⚠️ A range input draws its own track and thumb per engine, so neither can be
 * reached by an ordinary class — `accent-*` only recolours what the browser
 * already drew, which is why the first cut had a 2px black frame on every
 * element of this page except the two controls a reader actually touches.
 * The arbitrary-variant selectors below are the whole styling.
 */
const SLIDER =
    'mt-4 h-3 w-full cursor-pointer appearance-none rounded-full border-2 border-black bg-white ' +
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/25 ' +
    '[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none ' +
    '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black ' +
    '[&::-webkit-slider-thumb]:bg-[#05EFB8] [&::-webkit-slider-thumb]:cursor-grab ' +
    '[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full ' +
    '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:bg-[#05EFB8] ' +
    '[&::-moz-range-thumb]:cursor-grab';

const gbp = (n) =>
    new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
    }).format(n);

/**
 * The one loud thing on the page.
 *
 * 🚨 IT IS A MODEL, NOT A PROJECTION, AND IT SAYS SO. Every figure here is the
 * reader's own two numbers multiplied out — nothing is drawn from platform
 * data and nothing is promised. The note under it is not a disclaimer bolted
 * on; a page that shows a creator a climbing bar chart and does not say whose
 * arithmetic it is has made a forecast.
 *
 * ⚠️ THE BOUNDS ARE GBP AND ARE LABELLED GBP. The server rule
 * (`Helpers::priceWithinLimits`) is GBP-EQUIVALENT, so printing £4.99–£100
 * against a reader's own currency is the documented JPY fault — a creator told
 * "maximum 100" in a currency where that is 52p. The reader sets their real
 * price in their own currency in the form, where `lib/priceLimits.js` converts.
 */
function RecurringModel({ accent }) {
    const [members, setMembers] = useState(DEFAULT_MEMBERS);
    const [price, setPrice] = useState(DEFAULT_PRICE);

    const monthly = members * price;

    /*
     * The staircase. Segment N is the total a creator has been paid by the end
     * of month N — the point being that the line does not return to zero, which
     * is the sentence in the headline drawn rather than written.
     */
    const steps = useMemo(
        () =>
            Array.from({ length: MONTHS }, (_, i) => ({
                month: i + 1,
                total: monthly * (i + 1),
                height: ((i + 1) / MONTHS) * 100,
            })),
        [monthly],
    );

    const year = monthly * MONTHS;

    return (
        <div className="overflow-hidden rounded-box border-2 border-black bg-white">
            <div className="divide-y-2 divide-black">
                <div>
                {/* The two numbers the reader owns. */}
                <div className="px-5 pt-5 md:px-8 md:pt-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-black/55 md:text-[12px]">
                        Drag either one — put your own numbers in
                    </p>
                </div>

                <div className="grid gap-6 border-t-0 px-5 pb-6 pt-5 md:grid-cols-2 md:gap-10 md:px-8 md:pb-8">
                    <div>
                        <label
                            htmlFor="model-members"
                            className="block font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/60"
                        >
                            Members
                        </label>
                        <output
                            htmlFor="model-members"
                            className="mt-2 block font-gulfs text-4xl uppercase leading-none tabular-nums text-black md:text-5xl"
                        >
                            {members}
                        </output>
                        <input
                            id="model-members"
                            type="range"
                            min={1}
                            max={100}
                            step={1}
                            value={members}
                            onChange={(e) => setMembers(Number(e.target.value))}
                            className={SLIDER}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="model-price"
                            className="block font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/60"
                        >
                            A month, each
                        </label>
                        <output
                            htmlFor="model-price"
                            className="mt-2 block font-gulfs text-4xl uppercase leading-none tabular-nums text-black md:text-5xl"
                        >
                            {gbp(price)}
                        </output>
                        <input
                            id="model-price"
                            type="range"
                            min={Math.ceil(MIN_PRICE_GBP)}
                            max={MAX_PRICE_GBP.membership}
                            step={1}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className={SLIDER}
                        />
                    </div>
                </div>
                </div>

                {/* The staircase. */}
                <div className="px-5 py-6 md:px-8 md:py-8">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                        <p className="font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/60">
                            Your running total
                        </p>
                        <p className="font-gulfs text-lg uppercase tabular-nums text-black md:text-2xl">
                            {gbp(monthly)} <span className="text-black/50">a month</span>
                        </p>
                    </div>

                    <div
                        className="mt-5 flex h-28 items-end gap-1.5 md:h-40 md:gap-2"
                        role="img"
                        aria-label={`Running total over twelve months, reaching ${gbp(year)} by month twelve.`}
                    >
                        {steps.map((step) => (
                            <div
                                key={step.month}
                                className="flex-1 rounded-box-xs border-2 border-black"
                                style={{
                                    height: `${step.height}%`,
                                    backgroundColor: accent,
                                }}
                            />
                        ))}
                    </div>

                    <div className="mt-3 flex justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-black/50">
                        <span>Month 1</span>
                        <span>Month 12</span>
                    </div>

                    {/* Said plainly, because a climbing bar chart beside a
                        monthly figure reads as the monthly figure climbing —
                        which is the one thing this page must not imply. */}
                    <p className="mt-4 text-sm leading-[1.6] text-black/60">
                        Each bar is everything you have been paid by the end of
                        that month. Nothing here resets.
                    </p>
                </div>

                <LedgerTotal
                    label="Twelve months at that rate"
                    figure={gbp(year)}
                    note="Your two numbers multiplied out. Not a projection, and not a guarantee — members can cancel whenever they like."
                />
            </div>
        </div>
    );
}

export default function Memberships({
    perks = [],
    fees,
    threeTierLine,
    pillars = [],
}) {
    const accent = ACCENT.earn;
    const title =
        'Creator memberships — turn supporters into monthly members | Spenny Piggy';
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    /*
     * ⚠️ `onPlatform` is a RULE, not a category the creator invented. A
     * recurring content subscription has to deliver content on this platform,
     * so `MembershipController` adds the monthly content bundle when a creator
     * selects none. Splitting the list here is how the page says that before a
     * creator meets it in the form.
     */
    const included = perks.filter((perk) => perk.onPlatform);
    const extras = perks.filter((perk) => !perk.onPlatform);

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/memberships" />
                <meta property="og:title" content={title} />
                <meta
                    property="og:description"
                    content="Set up a membership in three steps and earn the same amount every month. You keep 100% of your listed price."
                />
            </Head>

            <Guest>
                <AdPage>
                    {/* ── Hero ─────────────────────────────────────────── */}
                    <Eyebrow accent={accent}>Memberships</Eyebrow>

                    <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                        Stop starting from
                        <br />
                        <span className="text-gradient-wishlist">
                            £0 every month.
                        </span>
                    </h1>

                    <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                        A handful of your supporters already pay you more than
                        anyone else. A membership turns that into the same
                        amount, on the same day, every month — without them
                        having to decide all over again.
                    </p>

                    <StartSelling promise={promise} />

                    <div className="mt-12">
                        <RecurringModel accent={accent} />
                    </div>

                    {/* ── What actually changes ────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHeadSplit
                            eyebrow="What changes"
                            accent={accent}
                            lead="Nothing here replaces what you already sell. A membership sits underneath it, so the month opens with something in it and everything else lands on top."
                        >
                            One good month,
                            <br />
                            <span className="text-gradient-wishlist">
                                then it repeats.
                            </span>
                        </SectionHeadSplit>

                        <LedgerFrame className="mt-10">
                            <LedgerRow
                                mark="1"
                                accent={accent}
                                title="A one-off sale"
                                line="Counts once. However good the month was, the next one opens at nothing and you sell it again from the start."
                                figure="Once"
                            />
                            <LedgerRow
                                mark="∞"
                                accent={accent}
                                title="A membership"
                                line="Counts every month until the member cancels. The same people, the same amount, on the same day."
                                figure="Monthly"
                            />
                            <LedgerRow
                                mark="+"
                                accent={accent}
                                title="Both together"
                                line="Members underneath, one-off sales and paid requests on top. Most creators here earn from more than one at a time."
                                figure="Stacked"
                            />
                            <LedgerTotal
                                label="What a member is worth"
                                figure="12×"
                                note="A supporter who joins in January and stays has paid twelve times by December. The same person, at the same price, without being asked again."
                            />
                        </LedgerFrame>
                    </section>

                    {/* ── The three steps ──────────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHeadSplit
                            eyebrow="Setting one up"
                            accent={accent}
                            lead="Three screens, in this order. These are the form’s own headings, so what you read here is what you will see when you open it."
                        >
                            Three steps,
                            <br />
                            <span className="text-gradient-wishlist">
                                then it is live.
                            </span>
                        </SectionHeadSplit>

                        <LedgerFrame className="mt-10">
                            <LedgerRow
                                mark="1"
                                accent={accent}
                                title="Choose a tier"
                                line="Bronze through Platinum, or Lifetime for a single payment. Run several side by side if different supporters want different things."
                            />
                            <LedgerRow
                                mark="2"
                                accent={accent}
                                title="What they get"
                                line="Tick the benefits from the list below. Write them once and every member sees the same thing on your page."
                            />
                            <LedgerRow
                                mark="3"
                                accent={accent}
                                title="Price & thumbnail"
                                line="Set the monthly price in your own currency and add the image supporters will see. That is the last screen."
                            />
                            <LedgerTotal
                                label="Then"
                                figure="Live"
                                note="It appears on your page and supporters can join from your link straight away. Payments arrive on your normal payout run."
                            />
                        </LedgerFrame>
                    </section>

                    {/* ── The benefits ─────────────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHeadSplit
                            eyebrow="What members get"
                            accent={accent}
                            lead="A fixed list, so you are picking from what is already allowed rather than writing an offer and hoping it clears review."
                        >
                            Tick the benefits.
                            <br />
                            <span className="text-gradient-wishlist">
                                Nothing to write.
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
                            {/* The rule, stated before the creator meets it. */}
                            <div className="overflow-hidden rounded-box border-2 border-black bg-white">
                                <div className="divide-y-2 divide-black">
                                    <div className="px-5 py-5 md:px-8 md:py-6">
                                        <h3 className="font-gulfs text-base uppercase leading-tight tracking-wide text-black md:text-lg">
                                            Always included
                                        </h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-black/80 md:text-base">
                                            Every membership delivers content
                                            here on Spenny Piggy. Pick one of
                                            these yourself, or the monthly
                                            bundle is added for you.
                                        </p>
                                    </div>
                                    {included.map((perk) => (
                                        <div
                                            key={perk.key}
                                            className="flex items-center gap-4 px-5 py-4 md:px-8 md:py-5"
                                        >
                                            <span
                                                className="h-3 w-3 shrink-0 rounded-full border-2 border-black"
                                                style={{
                                                    backgroundColor: accent,
                                                }}
                                                aria-hidden="true"
                                            />
                                            <span className="text-sm font-bold text-black md:text-base">
                                                {perk.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-box border-2 border-black bg-white">
                                <div className="divide-y-2 divide-black">
                                    <div className="px-5 py-5 md:px-8 md:py-6">
                                        <h3 className="font-gulfs text-base uppercase leading-tight tracking-wide text-black md:text-lg">
                                            Add what suits you
                                        </h3>
                                        <p className="mt-1.5 text-sm leading-relaxed text-black/80 md:text-base">
                                            Optional, and you can change them
                                            later. Take on only what you can
                                            keep up every month.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 px-5 py-5 md:px-8 md:py-6">
                                        {extras.map((perk) => (
                                            <span
                                                key={perk.key}
                                                className="rounded-box-sm border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black"
                                            >
                                                {perk.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="mt-6 max-w-2xl text-sm leading-[1.6] text-gray-400 md:text-base">
                            Everything on a membership is safe for work, and
                            every membership is a purchase of your content.
                            That is what keeps the payments side of the
                            platform working for everybody on it.
                        </p>
                    </section>

                    {/* ── What it costs ────────────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHead
                            eyebrow="What it costs"
                            accent={accent}
                            lead="Your member pays the fees on top of your price. What you listed is what reaches you."
                        >
                            You keep your
                            <br />
                            <span className="text-gradient-wishlist">
                                listed price.
                            </span>
                        </SectionHead>

                        <div className="mt-10">
                            <FeeBlock
                                fees={fees}
                                competitor="a membership platform"
                                competitorFees={[]}
                                accent={accent}
                                threeTierLine={threeTierLine}
                                headless
                            />
                        </div>

                        <div className="mt-10">
                            <WhyTheFee accent={accent} />
                        </div>
                    </section>

                    {/* ── The wider picture ────────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <SectionHeadSplit
                            eyebrow="The rest of it"
                            accent={accent}
                            lead="A membership is one of three shapes your income can take here, and most creators run more than one. They are separate products but they share a page, a checkout and a payout."
                        >
                            Three ways to be paid,
                            <br />
                            <span className="text-gradient-wishlist">
                                one account.
                            </span>
                        </SectionHeadSplit>

                        <PillarCards
                            pillars={pillars}
                            activeKey="memberships"
                            className="mt-10"
                        />
                    </section>

                    {/* ── Close ────────────────────────────────────────── */}
                    <section className="mt-16 md:mt-24">
                        <div className="rounded-box border-2 border-white/15 px-6 py-12 text-center md:px-12 md:py-16">
                            <h2 className="mx-auto max-w-3xl font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                                Your best supporters are
                                <br />
                                <span className="text-gradient-wishlist">
                                    already paying you.
                                </span>
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg">
                                Give them somewhere to keep doing it.
                            </p>
                            <StartSelling
                                promise={promise}
                                align="center"
                                className="mt-9"
                            />
                        </div>
                    </section>
                </AdPage>
            </Guest>
        </>
    );
}
