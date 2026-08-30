import { Head, Link } from '@inertiajs/react';
import Guest from '@/Layouts/GuestLayout';
import AdPage from '../components/AdPage';
import RiskBlock from '../components/RiskBlock';
import {
    ACCENT,
    Eyebrow,
    SectionHead,
    StartSelling,
} from '../components/Ledger';
import {
    PRICE_FORMATTED,
    SUBSCRIPTION_COPY,
} from '@/constants/creatorSubscription';

/**
 * /creators/compare — the index of every published comparison.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 2.
 *
 * 🚨 ONLY PUBLISHED SHEETS APPEAR. `CompetitorSheet::published()` filters them
 * server-side, so a card here is a promise that the page behind it is finished
 * and that Jack has cleared every "verify" row on it. An unpublished comparison
 * is absent, never greyed — a greyed card is an invitation to click it.
 *
 * ⚠️ Competitor names are PLAIN TEXT. No logo, no favicon, no lookalike colour,
 * nothing implying a partnership — the same rule as the pages themselves.
 */
export default function Index({ wishtenderLive = false, comparisons }) {
    const accent = ACCENT.safe;
    const title = 'Compare Spenny Piggy — fees and features, side by side';
    const promise = `${SUBSCRIPTION_COPY.promise} · ${PRICE_FORMATTED} + VAT / month after · cancel anytime`;

    return (
        <>
            <Head title={title}>
                <link rel="canonical" href="/creators/compare" />
            </Head>

            <Guest>
                <AdPage>
                    <Eyebrow accent={accent}>Compare</Eyebrow>

                    <h1 className="mt-5 font-gulfs text-5xl uppercase leading-[0.85] tracking-tight text-white sm:text-6xl md:text-[64px]">
                        Every fee,
                        <br />
                        <span className="text-gradient-wishlist">
                            side by side.
                        </span>
                    </h1>

                    <p className="mb-9 mt-7 max-w-xl text-base leading-relaxed text-gray-300 md:text-xl">
                        Every fee on these pages comes from the other platform’s
                        own website, with a link and the date we checked it.
                        Ours are read live from our checkout.
                    </p>

                    <RiskBlock
                        className="mt-12"
                        wishtenderLive={wishtenderLive}
                    />

                    <section className="mt-16 md:mt-24">
                        <SectionHead eyebrow="Side by side" accent={accent}>
                            Compare us to what you use now
                        </SectionHead>

                        {comparisons.length === 0 ? (
                            /*
                             * ⚠️ An honest empty state. Nothing is published
                             * yet, and inventing a card for a page that would
                             * 404 is the one thing this index must not do.
                             */
                            <p className="mt-8 rounded-box-sm border border-white/15 px-5 py-6 text-[15px] leading-[1.6] text-gray-300">
                                The first comparisons are being checked against
                                each platform’s own pages and will appear here.
                            </p>
                        ) : (
                            <div className="mt-8 grid gap-3 md:grid-cols-2">
                                {comparisons.map((row) => (
                                    <Link
                                        key={row.slug}
                                        href={`/creators/vs/${row.slug}`}
                                        className="group rounded-box-sm border border-white/15 px-5 py-5 transition-colors duration-200 hover:border-white/40"
                                    >
                                        <h3 className="font-gulfs text-[15px] uppercase tracking-[0.1em] text-white">
                                            Spenny Piggy vs {row.name}
                                        </h3>
                                        <p className="mt-3 text-[15px] leading-[1.55] text-gray-300">
                                            {row.what}
                                        </p>
                                        <span
                                            className="mt-4 inline-block font-mono text-[12px] uppercase tracking-[0.14em]"
                                            style={{ color: accent }}
                                        >
                                            See the comparison →
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="mt-16 md:mt-24">
                        <h2 className="font-gulfs text-4xl uppercase leading-[0.9] tracking-tight text-white md:text-6xl">
                            Keep the price you list.
                        </h2>
                        <StartSelling promise={promise} className="mt-8" />
                    </section>
                </AdPage>
            </Guest>
        </>
    );
}
