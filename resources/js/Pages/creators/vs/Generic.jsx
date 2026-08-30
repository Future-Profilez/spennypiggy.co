import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from '../components/AdPage';
import FeeBlock from '../components/FeeBlock';
import RiskBlock from '../components/RiskBlock';
import WhyTheFee from '../components/WhyTheFee';
import {
    ACCENT,
    Eyebrow,
    SectionHeadSplit,
    StartSelling,
} from '../components/Ledger';
import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from '@/constants/creatorSubscription';

/**
 * The two generic comparison pages — vs a wishlist, vs just a link in bio.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5b.
 *
 * 🚨 NO BRAND IS NAMED ON THIS PAGE, EVER. The right-hand column is a CATEGORY,
 * which is what makes the whole page publishable without sourcing: there is no
 * company being described, so there is nothing to cite and nothing that can go
 * out of date. The moment a brand name appears here, every row needs a source
 * link and a checked-on date — use the `comparison` layout for that instead.
 *
 * ⚠️ There is deliberately NO competitor fee table. A category has no published
 * fees to quote. Our own three rails still show in full, because the whole point
 * of these pages is that our side is never the vague one.
 */
export default function Generic({
    wishtenderLive = false,
    competitor,
    fees,
    threeTierLine,
}) {
    const accent = ACCENT.safe;
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

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
                    <Eyebrow accent={accent}>Compare</Eyebrow>

                    <h1 className="mt-5 font-gulfs text-[clamp(2.5rem,11vw,3rem)] uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                        Spenny Piggy
                        <br />
                        <span className="text-gradient-wishlist">
                            vs {competitor.name}
                        </span>
                    </h1>

                    <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                        {competitor.heroSubline}
                    </p>

                    <StartSelling promise={promise} />

                    <RiskBlock
                        className="mt-14"
                        wishtenderLive={wishtenderLive}
                    />

                    {/* ── The comparison ──────────────────────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Side by side"
                            accent={accent}
                            lead={`No brand names below — this is ${competitor.name} as a category, not any one product.`}
                        >
                            What each one{' '}
                            <span className="text-gradient-wishlist">does</span>
                        </SectionHeadSplit>

                        {/* Desktop table, in its own scroll container. */}
                        <div className="mt-8 hidden overflow-x-auto md:block">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-white/15">
                                        <th className="w-1/3 py-4 pr-6 font-mono text-[12px] uppercase tracking-[0.14em] text-gray-400" />
                                        <th className="py-4 pr-6 font-mono text-[12px] uppercase tracking-[0.14em] text-[#05EFB8]">
                                            Spenny Piggy
                                        </th>
                                        <th className="py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-gray-400">
                                            {competitor.name}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {competitor.rows.map((row) => (
                                        <tr
                                            key={row.label}
                                            className="border-b border-white/10 align-top"
                                        >
                                            <td className="py-4 pr-6 text-base leading-[1.5] text-gray-200">
                                                {row.label}
                                            </td>
                                            <td className="py-4 pr-6 text-base leading-[1.5] text-white">
                                                {row.ours}
                                            </td>
                                            <td className="py-4 text-base leading-[1.5] text-gray-300">
                                                {row.theirs}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile: one card per row. */}
                        <div className="mt-8 grid gap-3 md:hidden">
                            {competitor.rows.map((row) => (
                                <div
                                    key={row.label}
                                    className="rounded-box-sm border border-white/15 px-4 py-4"
                                >
                                    <p className="text-[15px] leading-[1.45] text-gray-200">
                                        {row.label}
                                    </p>
                                    <dl className="mt-3 grid gap-3">
                                        <div>
                                            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#05EFB8]">
                                                Spenny Piggy
                                            </dt>
                                            <dd className="mt-1 text-[15px] leading-[1.5] text-white">
                                                {row.ours}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400">
                                                {competitor.name}
                                            </dt>
                                            <dd className="mt-1 text-[15px] leading-[1.5] text-gray-300">
                                                {row.theirs}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="The money"
                            accent={accent}
                            lead="Every rate and the flat fee, read live from our own checkout — so they can never drift from what a supporter is charged."
                        >
                            What a payment{' '}
                            <span className="text-gradient-wishlist">
                                really costs
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-10">
                            <FeeBlock
                                headless
                                fees={fees}
                                competitor={competitor.name}
                                /* A category publishes no fees, so there is nothing
                               to list and nothing to source. */
                                competitorFees={[]}
                                accent={accent}
                                threeTierLine={threeTierLine}
                            />
                        </div>
                    </section>

                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Why the fee"
                            accent={accent}
                            lead="Three rails, one flat fee, and what the difference pays for — including the parts a link page does not do at all."
                        >
                            Why our fee is{' '}
                            <span className="text-gradient-wishlist">
                                what it is
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-10">
                            <WhyTheFee headless accent={accent} />
                        </div>
                    </section>

                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="To be fair"
                            accent={accent}
                            lead="We would rather you chose with the whole picture. These are the things it does better than us, in our own words."
                        >
                            Where {competitor.name} is{' '}
                            <span className="text-gradient-wishlist">
                                better
                            </span>
                        </SectionHeadSplit>

                        <ul className="mt-10 grid gap-3 md:grid-cols-2">
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

                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Ten minutes"
                            accent={accent}
                            lead="Nothing to cancel first, and nothing to pay until you have made a sale."
                        >
                            Moving{' '}
                            <span className="text-gradient-wishlist">
                                across
                            </span>
                        </SectionHeadSplit>

                        {/*
                         * 🚨 THE NUMBERING IS TRUE HERE — a real sequence, where
                         * "Where they are better" directly above is a SET and
                         * stays unnumbered. The cells ABUT (`gap-px` over the
                         * parent's fill), same device as the hero's stat strip:
                         * one route, three stages. Kept identical to `Show` and
                         * `CaseStudy` so the three layouts read as one page
                         * type.
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
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <p className="mt-4 text-[15px] leading-[1.6] text-gray-200">
                                        {step}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section className="mt-14 border-t-2 border-white/15 pt-10 md:mt-16 md:pt-12">
                        <h2 className="font-gulfs text-4xl uppercase leading-[0.9] tracking-tight text-white md:text-[64px]">
                            Keep the price{' '}
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
