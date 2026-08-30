import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from '../components/AdPage';
import RiskBlock from '../components/RiskBlock';
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
 * The case-study page — a platform that closed.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5 (WishTender).
 *
 * 🚨 THIS IS THE ONE PAGE ON THIS BUILD WITH LEGAL CONSEQUENCES IF IT IS WRITTEN
 * CARELESSLY, AND THE RULES ARE NOT NEGOTIABLE:
 *
 *   · Every claim links to the company's OWN announcement. A third-party report
 *     may be cited for the DATE only; its speculation is never repeated.
 *   · Their words are QUOTED and attributed, never characterised. No adjective
 *     of ours is attached to them.
 *   · Nothing implies the payment provider acted unfairly, and nothing states
 *     why it acted — the company's own "unexpected policy change" is the only
 *     description of the reason that appears anywhere.
 *   · No creators, communities or content types are named. No screenshots.
 *   · Tone is factual and respectful. No gloating. The argument is about the
 *     PAYMENT — a gift has no deliverable — never about the people who used it.
 *   · Spenny Piggy being SFW-only is stated as a fact about this platform and
 *     never as a judgement of the reader. 18+ creators are welcome here for the
 *     SFW side of what they do, and the page has to read that way.
 *
 * ⚠️ There is NO fee table and no "what a £20 payment costs". A fee comparison
 * against a business that charges nobody anything would be point-scoring, and
 * the spec removes it deliberately.
 *
 * ⚠️ Past tense throughout for them, present for us. The differences table is
 * "as it operated", which is why its column header says so.
 */
export default function CaseStudy({ wishtenderLive = false, competitor }) {
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
                    <Eyebrow accent={accent}>What happened</Eyebrow>

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

                    {/* ⚠️ A share of the column width, not a fixed measure —
                        see the note in `vs/Show.jsx` on why every right edge on
                        these pages now agrees. */}
                    <p className="mb-9 mt-7 max-w-2xl text-base leading-relaxed text-gray-300 md:text-xl lg:max-w-[52%]">
                        {competitor.heroSubline}
                    </p>

                    <StartSelling promise={promise} />

                    <RiskBlock
                        className="mt-12 md:mt-14"
                        wishtenderLive={wishtenderLive}
                    />

                    {/* ── 1. The timeline, every line sourced ─────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Sourced timeline"
                            accent={accent}
                            lead={`Every line below carries a link to where it was reported. Nothing here is our account of it.`}
                        >
                            What{' '}
                            <span className="text-gradient-wishlist">
                                happened
                            </span>
                        </SectionHeadSplit>

                        {/*
                         * 🚨 ONE FRAME, ROWS SHARING HAIRLINES. A chronology is
                         * a single thing made of dated parts, and drawn as
                         * separate cards it read as a stack of unrelated
                         * notices with no thread between them. The date sits in
                         * its own left column so the dates form a spine a reader
                         * can run down — which is the only reason a timeline is
                         * a timeline rather than a list.
                         */}
                        <ol className="mt-10 overflow-hidden rounded-box border border-white/15">
                            {competitor.timeline.map((entry) => (
                                <li
                                    key={entry.when}
                                    className="border-t border-white/10 px-5 py-5 first:border-t-0 md:grid md:grid-cols-12 md:gap-x-6 md:px-6"
                                >
                                    <span
                                        className="font-mono text-[12px] uppercase leading-[1.4] tracking-[0.14em] md:col-span-3"
                                        style={{ color: accent }}
                                    >
                                        {entry.when}
                                    </span>

                                    <div className="md:col-span-9">
                                        <p className="mt-3 text-[15px] leading-[1.6] text-gray-200 md:mt-0 md:text-base">
                                            {entry.what}
                                        </p>

                                        {/*
                                         * ⚠️ The source is on every entry and is not
                                         * optional — CompetitorSheet refuses the page
                                         * without one on each line.
                                         */}
                                        <a
                                            href={entry.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            className="mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                                        >
                                            {entry.source} →
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        {competitor.closingNote && (
                            <p className="mt-6 max-w-3xl text-base leading-[1.6] text-gray-300">
                                {competitor.closingNote}
                            </p>
                        )}
                    </section>

                    {/* ── 2. What it meant for creators ───────────────── */}
                    {competitor.consequences?.length > 0 && (
                        <section className="mt-14 md:mt-16">
                            <SectionHeadSplit
                                eyebrow="The effect"
                                accent={accent}
                                lead="What a platform closing costs the people selling on it — the part that is never on a pricing page."
                            >
                                What it meant for{' '}
                                <span className="text-gradient-wishlist">
                                    creators
                                </span>
                            </SectionHeadSplit>

                            <ul className="mt-10 grid gap-3 md:grid-cols-3">
                                {competitor.consequences.map((point) => (
                                    <li
                                        key={point}
                                        className="rounded-box-sm border border-white/15 px-5 py-5 text-[15px] leading-[1.6] text-gray-200"
                                    >
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* ── 3. What we do differently ───────────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="The difference"
                            accent={accent}
                            lead="Row by row, how the same job is done here — and what is in place so the same thing does not happen to your income."
                        >
                            What we do{' '}
                            <span className="text-gradient-wishlist">
                                differently
                            </span>
                        </SectionHeadSplit>

                        <div className="mt-10 hidden overflow-x-auto md:block">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-white/15">
                                        <th className="w-1/4 py-4 pr-6 font-mono text-[12px] uppercase tracking-[0.14em] text-gray-400" />
                                        <th className="py-4 pr-6 font-mono text-[12px] uppercase tracking-[0.14em] text-gray-400">
                                            {competitor.name} (as it operated)
                                        </th>
                                        <th className="py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[#05EFB8]">
                                            Spenny Piggy
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {competitor.differences.map((row) => (
                                        <tr
                                            key={row.label}
                                            className="border-b border-white/10 align-top"
                                        >
                                            <td className="py-4 pr-6 text-base leading-[1.5] text-gray-200">
                                                {row.label}
                                            </td>
                                            <td className="py-4 pr-6 text-base leading-[1.5] text-gray-300">
                                                {row.theirs}
                                            </td>
                                            <td className="py-4 text-base leading-[1.5] text-white">
                                                {row.ours}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 grid gap-3 md:hidden">
                            {competitor.differences.map((row) => (
                                <div
                                    key={row.label}
                                    className="rounded-box-sm border border-white/15 px-4 py-4"
                                >
                                    <p className="text-[15px] leading-[1.45] text-gray-200">
                                        {row.label}
                                    </p>
                                    <dl className="mt-3 grid gap-3">
                                        <div>
                                            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400">
                                                {competitor.name} (as it
                                                operated)
                                            </dt>
                                            <dd className="mt-1 text-[15px] leading-[1.5] text-gray-300">
                                                {row.theirs}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#05EFB8]">
                                                Spenny Piggy
                                            </dt>
                                            <dd className="mt-1 text-[15px] leading-[1.5] text-white">
                                                {row.ours}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── 4. Where they were better ───────────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="To be fair"
                            accent={accent}
                            lead="We would rather you chose with the whole picture. These are the things it did better than us, in our own words."
                        >
                            Where {competitor.name} was{' '}
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

                    {/* ── 5. If you were on it ────────────────────────── */}
                    <section className="mt-14 md:mt-16">
                        <SectionHeadSplit
                            eyebrow="Ten minutes"
                            accent={accent}
                            lead="Nothing to cancel first, and nothing to pay until you have made a sale."
                        >
                            If you were on{' '}
                            <span className="text-gradient-wishlist">
                                {competitor.name}
                            </span>
                        </SectionHeadSplit>

                        {/*
                         * 🚨 THE NUMBERING IS TRUE HERE, WHICH IS WHY IT IS
                         * DRAWN — these three are a real sequence, where "Where
                         * they were better" directly above is a SET and stays
                         * unnumbered. Two identical three-up grids back to back
                         * is what made this half of the page read as one shrug.
                         * The cells ABUT (`gap-px` over the parent's fill), same
                         * device as the hero's stat strip: one route, three
                         * stages.
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
