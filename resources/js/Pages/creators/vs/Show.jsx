import { Head, Link } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import AdPage from "../components/AdPage";
import FeatureMatrix from "../components/FeatureMatrix";
import FeeBlock from "../components/FeeBlock";
import FeeSnapshot from "../components/FeeSnapshot";
import RiskBlock from "../components/RiskBlock";
import WhyTheFee from "../components/WhyTheFee";
import {
    ACCENT,
    Eyebrow,
    SectionHeadSplit,
    StartSelling,
    StatCell,
} from "../components/Ledger";
import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from "@/constants/creatorSubscription";

/**
 * The comparison template — one page for every /creators/vs/{slug}.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 3. The section
 * ORDER below is the spec's and is the argument the page makes: what this is →
 * why fees are not the whole question → what a payment costs → what each product
 * does → why our fee is what it is → where they are better → how to move.
 *
 * 🚨 EVERY WORD ABOUT A COMPETITOR COMES FROM ITS CONFIG FILE, AND EVERY FIGURE
 * ABOUT US FROM THE LIVE PAYMENTS CONFIG. Nothing on this page is typed into the
 * component. A page that hardcodes one competitor's number is a page that keeps
 * saying it after they change it.
 *
 * 🚨 CONTENT RULES, ALL FROM THE SPEC AND ALL NON-NEGOTIABLE:
 *   · a competitor is named in PLAIN TEXT — never a logo, favicon, screenshot or
 *     lookalike colour, and nothing that implies a partnership;
 *   · "Not on their pricing page" is the strongest wording permitted anywhere on
 *     this page. Never "hidden", "sneaky" or "scam";
 *   · "Where they are better" is MANDATORY and genuine — CompetitorSheet refuses
 *     to build a page with fewer than two;
 *   · every competitor fact carries a source link and the date it was checked.
 *
 * ⚠️ We do NOT "fight chargebacks on your behalf" and this page must never say
 * so. The creator is merchant of record and answers with the evidence we gather.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🚨 THIS PAGE IS ON THE `/creators/*` TWELVE-COLUMN SPINE (29 Aug 2026).
 *
 * It was the one page in the section that was not, and it showed. Eight sections
 * opened identically — `mt-16 md:mt-24` of empty space, an eyebrow, a heading at
 * `md:text-5xl` at the same x, a `max-w-2xl` grey lead beneath it — for the
 * whole scroll, with nothing but that space telling a reader where one argument
 * ended and the next began. Left edges all agreed and right edges did not:
 * `max-w-xl` on the hero lead, `max-w-2xl` on five heads, full width on the
 * worked example and the two card grids, so the page ended on four different
 * vertical lines. Alignment is where things END as much as where they start —
 * `Ledger.jsx`'s `GRID` docblock records the same finding on the sibling page,
 * and `SectionHeadSplit` is the fix that already existed here and this page had
 * never adopted.
 *
 * What that buys, concretely:
 *   · every section now opens on a `border-t-2 border-white/15` hairline, so
 *     separation is drawn rather than implied by 96px of nothing;
 *   · heading and lead sit side by side on the spine, which removes a stacked
 *     block of height from every section and gives the page a second shape;
 *   · TWO heading ranks instead of five. `md:text-[42px]` is the argument rank
 *     (every section), `md:text-[64px]` is the page rank (the h1 and the close)
 *     — and nothing else competes. `FeatureMatrix`, `FeeBlock` and `WhyTheFee`
 *     each drew their own `md:text-5xl` h2, so they are mounted `headless` and
 *     the page draws all three heads in one voice.
 */
export default function Show({
    wishtenderLive = false,
    competitor,
    matrix,
    competitorFees,
    fees,
    threeTierLine,
}) {
    const accent = ACCENT.safe;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    // The newest date on the sheet — what "Checked …" under the matrix means.
    const checkedOn = competitorFees
        .map((row) => row.checkedOn)
        .filter(Boolean)
        .sort()
        .pop();

    const canonical = `/creators/vs/${competitor.slug}`;

    return (
        <>
            <Head title={competitor.metaTitle}>
                <link rel="canonical" href={canonical} />
                <meta name="description" content={competitor.metaDescription} />
                <meta property="og:title" content={competitor.metaTitle} />
                <meta
                    property="og:description"
                    content={competitor.metaDescription}
                />
                <meta property="og:image" content="/siteicon.png" />
                <meta
                    property="og:url"
                    content={`https://spennypiggy.co${canonical}`}
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={competitor.metaTitle} />
                <meta
                    name="twitter:description"
                    content={competitor.metaDescription}
                />
                <meta name="twitter:image" content="/siteicon.png" />
            </Head>

            <Guest>
                <AdPage>
                    {/* ── Hero ─────────────────────────────────────────── */}
                    <Eyebrow accent={accent}>Compare</Eyebrow>

                    {/*
                     * ⚠️ FLUID AT THE NARROW END, NOT A FIXED 48px. A
                     * competitor's name is data, so the h1's longest line is
                     * whatever the sheet is called — measured at 320px,
                     * "vs WishTender" ran 325px inside a 280px column and was
                     * clipped by the shell's `overflow-hidden`, silently. The
                     * clamp reaches the full 48px by ~436px and never asks the
                     * name to fit a width it cannot. Do not replace it with a
                     * `break-words`: display caps broken mid-word read as a
                     * rendering fault.
                     */}
                    <h1 className="mt-5 font-gulfs text-[clamp(2.5rem,11vw,3rem)] uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                        Spenny Piggy
                        <br />
                        <span className="text-gradient-wishlist">
                            vs {competitor.name}
                        </span>
                    </h1>

                    {/*
                     * ⚠️ `lg:max-w-[52%]` rather than `max-w-xl`. A fixed measure
                     * is a line invented for one element; a share of the column
                     * width is the same line every head on the page ends on.
                     */}
                    <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl lg:max-w-[52%]">
                        {competitor.heroSubline}
                    </p>

                    <StartSelling promise={promise} />

                    {/*
                     * The four stat tiles. ⚠️ The fourth is deliberate and is
                     * the spec's own point: no competitor on any of these pages
                     * offers live chat, so it sits above the fold on every one.
                     */}
                    <div className="mt-12 grid gap-px overflow-hidden rounded-box bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="100%"
                            label="Of your listed price"
                            note="No revenue cut. Supporters cover the platform fee at checkout."
                        />
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="Weekly"
                            label="Payout runs"
                            note="Straight to your own bank account through Stripe."
                        />
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="7"
                            label="Ways to get paid"
                            note="Five a supporter buys once, two they pay every month."
                        />
                        <StatCell
                            className="bg-[#0B0B0C]"
                            accent={accent}
                            figure="Live chat"
                            label="Real people"
                            note="When money is on the line, not a form and a three-day wait."
                        />
                    </div>

                    {/* ── Component D ──────────────────────────────────── */}
                    <RiskBlock
                        className="mt-12 md:mt-14"
                        wishtenderLive={wishtenderLive}
                    />

                    {/*
                     * ── The £20 snapshot ─────────────────────────────────
                     *
                     * 🚨 IT SITS HERE, NOT ABOVE `RiskBlock`, AND THAT IS NOT A
                     * PREFERENCE. The client asked for the table "high up at the
                     * top of the pages" — this is the highest position it can
                     * take, because `RiskBlock`'s heading is transcribed word for
                     * word from the spec and reads "Before you compare fees, read
                     * this." A fee table above it would make that sentence untrue
                     * on the page carrying it, and that copy may not be
                     * paraphrased. So the snapshot is the first fee content on
                     * the page and the third block on it.
                     */}
                    <FeeSnapshot
                        fees={fees}
                        competitor={competitor.name}
                        example={competitor.example}
                        accent={accent}
                    />

                    {/* ── Component B ──────────────────────────────────── */}
                    <section id="the-money" className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="The money"
                            accent={accent}
                            lead="Percentages next to percentages, flat fees next to flat fees, every line for both of us. Ours are read live from our checkout, so they can never drift from what a supporter is charged."
                        >
                            What a payment{" "}
                            <span className="text-gradient-wishlist">
                                really costs
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-10">
                            <FeeBlock
                                headless
                                fees={fees}
                                competitor={competitor.name}
                                competitorFees={competitorFees}
                                accent={accent}
                                threeTierLine={threeTierLine}
                            />
                        </div>

                        {/*
                         * ⚠️ THE WORKED EXAMPLE IS LABELLED AND FRAMED, not left
                         * as a bare paragraph under the fee cards. It is the one
                         * place on the page where the competitor's own published
                         * rates are carried all the way through to a figure, so
                         * it is the most persuasive block here — and unlabelled
                         * it read as a footnote somebody had forgotten to place.
                         *
                         * The left rule is INLINE: `border-black` is a full 2px
                         * all-sides shorthand in this project, so a `border-l-*`
                         * utility beside it is discarded silently and the block
                         * draws a box on four sides instead of a rule on one.
                         */}
                        {competitor.example?.note && (
                            <figure
                                className="mt-8 pl-5 md:pl-6 lg:w-[calc((100%-11*1.5rem)/12*9+8*1.5rem)]"
                                style={{ borderLeft: "3px solid #FF007F" }}
                            >
                                <figcaption className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-400">
                                    Worked example · {competitor.name}
                                </figcaption>
                                <p className="mt-3 text-[15px] leading-[1.65] text-gray-200 md:text-base">
                                    {competitor.example.note}
                                </p>
                            </figure>
                        )}
                    </section>

                    {/* ── Component A ──────────────────────────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Feature by feature"
                            accent={accent}
                            lead={`Every row below is from ${competitor.name}’s own pages, with a link. Where they do not say, we say “Not stated” rather than guess.`}
                        >
                            What each one{" "}
                            <span className="text-gradient-wishlist">does</span>
                        </SectionHeadSplit>

                        <div className="mt-10">
                            <FeatureMatrix
                                headless
                                rows={matrix}
                                competitor={competitor.name}
                                checkedOn={checkedOn}
                                accent={accent}
                            />
                        </div>
                    </section>

                    {/*
                     * The competitor callout — their strongest claim, answered
                     * with the bank / tax / chargeback point. Optional: a sheet
                     * without one renders nothing rather than an empty card.
                     */}
                    {competitor.callout?.heading && (
                        <section className="mt-14 rounded-box border-black bg-[#111113] px-6 py-8 md:mt-16 md:px-10 md:py-11">
                            <h2 className="max-w-3xl font-gulfs text-2xl uppercase leading-[0.95] tracking-tight text-white md:text-4xl">
                                {competitor.callout.heading}
                            </h2>
                            {(competitor.callout.body || []).map((para) => (
                                <p
                                    key={para}
                                    className="mt-5 max-w-3xl text-base leading-[1.6] text-gray-300 md:text-lg"
                                >
                                    {para}
                                </p>
                            ))}
                        </section>
                    )}

                    {/* ── Component C ──────────────────────────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Why the fee"
                            accent={accent}
                            lead="Three rails, one flat fee, and what the difference pays for — including the parts nobody else on this page offers."
                        >
                            Why our fee is{" "}
                            <span className="text-gradient-wishlist">
                                what it is
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-10">
                            <WhyTheFee headless accent={accent} />
                        </div>
                    </section>

                    {/* ── Where they are better (mandatory) ────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="To be fair"
                            accent={accent}
                            lead="We would rather you chose with the whole picture. These are the things they do better than us, in our own words."
                        >
                            Where {competitor.name} is{" "}
                            <span className="text-gradient-wishlist">
                                better
                            </span>
                        </SectionHeadSplit>

                        <ul className="mt-10 grid gap-3 md:grid-cols-3">
                            {competitor.betterAt.map((point) => (
                                <li
                                    key={point}
                                    className="rounded-box-sm border border-white/15 px-5 py-5 text-[15px] leading-[1.6] text-gray-200"
                                >
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* ── Moving across ───────────────────────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Ten minutes"
                            accent={accent}
                            lead="Nothing to cancel first, and nothing to pay until you have made a sale. Keep the other page for whatever it is still good at."
                        >
                            Moving from{" "}
                            <span className="text-gradient-wishlist">
                                {competitor.name}
                            </span>
                        </SectionHeadSplit>

                        {/*
                         * 🚨 THE NUMBERING IS TRUE HERE, WHICH IS WHY IT IS
                         * DRAWN. These three are a real sequence — you cannot
                         * list what you sell before the profile exists — so the
                         * ordinal carries information rather than decorating
                         * three boxes. "Where they are better" directly above is
                         * a SET, not a sequence, and is deliberately left
                         * unnumbered and separated: two identical three-up grids
                         * back to back is what made this half of the page read
                         * as one long shrug.
                         *
                         * ⚠️ The cells ABUT — `gap-px` over a `bg-white/15`
                         * parent, so the hairline between them is the parent
                         * showing through rather than a border per cell, which
                         * doubles up where two meet. Same device as the hero's
                         * stat strip, and it is what makes three steps read as
                         * one route.
                         */}
                        <ol className="mt-10 grid gap-px overflow-hidden rounded-box bg-white/15 md:grid-cols-3">
                            {competitor.switchSteps.map((step, i) => (
                                <li
                                    key={step}
                                    className="bg-[#0B0B0C] px-5 py-6 md:px-6 md:py-7"
                                >
                                    <span
                                        className="block font-gulfs text-3xl uppercase leading-none md:text-4xl"
                                        style={{ color: accent }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <p className="mt-4 text-[15px] leading-[1.6] text-gray-200">
                                        {step}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* ── Close ───────────────────────────────────────── */}
                    <section className="mt-14 border-t-2 border-white/15 pt-10 md:mt-16 md:pt-12">
                        <h2 className="font-gulfs text-4xl uppercase leading-[0.9] tracking-tight text-white md:text-[64px]">
                            Keep the price{" "}
                            <span className="text-gradient-wishlist">
                                you list.
                            </span>
                        </h2>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg">
                            Listing is free. You are not charged anything until
                            you have made a sale.
                        </p>

                        <StartSelling promise={promise} className="mt-8" />

                        <Link
                            href="/creators/compare"
                            className="mt-8 inline-block font-mono text-[12px] uppercase tracking-[0.14em] text-gray-400 underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                        >
                            See every comparison →
                        </Link>
                    </section>
                </AdPage>
            </Guest>
        </>
    );
}
