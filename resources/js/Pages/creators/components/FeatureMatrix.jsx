import { Fragment } from 'react';
import { Eyebrow } from './Ledger';

/**
 * Component A — the feature matrix.
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Sections 3 and 4.
 *
 * 🚨 THE ROWS COME FROM THE SERVER, IN SERVER ORDER, AND THIS COMPONENT ADDS
 * NONE. Twenty-one fixed rows in one order on every page is the whole value of
 * the matrix — a creator reading two comparison pages is answering the same
 * questions in the same sequence. `config/comparison_matrix.php` owns them.
 *
 * 🚨 A CELL IS ONE OF FOUR THINGS: ✓, ✗, "Coming soon" or "Not stated", and
 * nothing else. No prose, no half-ticks, no footnote markers. "Not stated" is
 * the answer when a competitor does not publish one — it is never left blank
 * and never guessed, because a guess is indistinguishable from a sourced fact
 * once it is on the page.
 *
 * ⚠️ Every competitor cell that carries a source shows it as a link. The 18+
 * row can never read anything but "no"/"Not stated" without one — enforced
 * server-side in CompetitorSheet, not here.
 *
 * ⚠️ Mobile: the table becomes stacked cards rather than scrolling sideways.
 * A 21-row two-column table on a 390px screen is unreadable either way, and a
 * horizontal scroll hides the column that carries the argument.
 */
export default function FeatureMatrix({
    rows,
    competitor,
    checkedOn,
    accent,
    headless = false,
}) {
    return (
        <section>
            {/*
             * ⚠️ `headless` lets the PAGE draw the head instead, through the
             * shared `SectionHeadSplit`. It exists because this component used
             * to hand-roll its own `md:text-5xl` h2 — as did `FeeBlock` and
             * `WhyTheFee` — so five sections on one page all shouted at the
             * same size with no relationship to their importance, and none of
             * them sat on the page's twelve-column spine. Default false: the
             * other `/creators/*` pages that mount these are untouched.
             */}
            {!headless && (
                <>
                    <Eyebrow accent={accent}>Feature by feature</Eyebrow>

                    <h2 className="mt-4 font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                        What each one does
                    </h2>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
                        Every row below is from {competitor}’s own pages, with a
                        link. Where they do not say, we say “Not stated” rather
                        than guess.
                    </p>
                </>
            )}

            {/* Desktop: a real table. Its own scroll container, per the house
                rule that wide content never makes the page scroll sideways. */}
            <div className="mt-8 hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-white/15">
                            <th className="w-1/2 py-4 pr-6 font-mono text-[12px] uppercase tracking-[0.14em] text-gray-400">
                                Feature
                            </th>
                            <th className="py-4 pr-6 font-mono text-[12px] uppercase tracking-[0.14em] text-[#05EFB8]">
                                Spenny Piggy
                            </th>
                            <th className="py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-gray-400">
                                {competitor}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <Fragment key={row.key}>
                                {/*
                                 * 🚨 A BAND, NOT A REORDER. Twenty-one identical
                                 * rows was 1,476px of wall — the reader scrolls
                                 * past it rather than reads it, and the one row
                                 * they came for is indistinguishable from the
                                 * twenty they did not. The bands fall on
                                 * boundaries the fixed order already had, so the
                                 * shared row sequence is untouched.
                                 */}
                                {row.group && (
                                    <tr>
                                        <th
                                            colSpan={3}
                                            scope="colgroup"
                                            /*
                                             * 🚨 NO `first:pt-0` HERE. Each of
                                             * these `<th>`s is the ONLY child of
                                             * its own `<tr>`, so `:first-child`
                                             * matches EVERY band, not the first
                                             * one — measured `padding-top: 0px` on
                                             * all four, and the labels collided
                                             * with the row above them. `first:` is
                                             * per-row inside a table, never per
                                             * table.
                                             */
                                            className="pb-3 pt-10 text-left font-mono text-[11px] font-normal uppercase tracking-[0.16em]"
                                            style={{ color: accent }}
                                        >
                                            {row.group}
                                        </th>
                                    </tr>
                                )}
                                <tr className="border-b border-white/10 align-top">
                                    <td className="py-4 pr-6 text-base leading-[1.5] text-gray-200">
                                        {row.label}
                                    </td>
                                    <td className="py-4 pr-6 text-base text-white">
                                        {row.ours}
                                    </td>
                                    <td className="py-4 text-base text-gray-300">
                                        <Cell
                                            value={row.theirs}
                                            sourceUrl={row.sourceUrl}
                                        />
                                    </td>
                                </tr>
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: one card per row. */}
            <div className="mt-8 grid gap-3 md:hidden">
                {rows.map((row) => (
                    <Fragment key={row.key}>
                        {row.group && (
                            <p
                                className="mt-5 font-mono text-[11px] uppercase tracking-[0.16em] first:mt-0"
                                style={{ color: accent }}
                            >
                                {row.group}
                            </p>
                        )}
                        <div className="rounded-box-sm border border-white/15 px-4 py-4">
                            <p className="text-[15px] leading-[1.45] text-gray-200">
                                {row.label}
                            </p>

                            <dl className="mt-3 grid grid-cols-2 gap-3">
                                <div>
                                    <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#05EFB8]">
                                        Spenny Piggy
                                    </dt>
                                    <dd className="mt-1 text-[15px] text-white">
                                        {row.ours}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400">
                                        {competitor}
                                    </dt>
                                    <dd className="mt-1 text-[15px] text-gray-300">
                                        <Cell
                                            value={row.theirs}
                                            sourceUrl={row.sourceUrl}
                                        />
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </Fragment>
                ))}
            </div>

            {checkedOn && (
                <p className="mt-6 font-mono text-[12px] leading-[1.5] text-gray-500">
                    Checked {checkedOn}. If anything here is out of date, tell
                    us on chat and we will correct it.
                </p>
            )}
        </section>
    );
}

/**
 * ⚠️ The source link is on the VALUE, not a superscript marker — a footnote
 * number on a phone is a target nobody can hit, and the spec asks for the
 * source on hover or tap.
 */
function Cell({ value, sourceUrl }) {
    if (!sourceUrl) {
        return <span>{value}</span>;
    }

    return (
        <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline decoration-white/30 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
        >
            {value}
            <span className="sr-only"> (source, opens in a new tab)</span>
        </a>
    );
}
