import { Eyebrow } from "./Ledger";

/**
 * Component B — "What a £20 payment really costs".
 *
 * Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Sections 3 and 4.
 *
 * 🚨 NOT ONE FIGURE ON OUR SIDE IS WRITTEN IN THIS FILE. Every rate, the flat
 * fee and the supporter total arrive as props from
 * `App\Support\ComparisonFeePayload`, which prices the example through
 * `Helpers::calculateStripeDirectChargeFlow()` — the same engine that charges a
 * real supporter at checkout.
 *
 * That is the page's claim, not an implementation detail: these pages tell a
 * creator our fees are shown in full and can never drift from what the checkout
 * takes. A percentage typed into this component makes that false, and nothing
 * anywhere would ever report it. The spec's acceptance criterion says the same
 * thing from the other side — changing a rate in config/payments.php must move
 * these numbers with no code change.
 *
 * ⚠️ PERCENTAGES NEXT TO PERCENTAGES, FLAT FEES NEXT TO FLAT FEES. Every
 * platform on these pages charges both kinds, and folding one into the other is
 * how a comparison stops being one.
 *
 * ⚠️ "Not on their pricing page" is the STRONGEST wording permitted in this UI.
 * Never "hidden", never "sneaky", never "scam" — a spec rule, and it is what
 * keeps the page factual rather than an attack.
 */
export default function FeeBlock({
    fees,
    competitor,
    competitorFees,
    accent,
    threeTierLine,
    headless = false,
}) {
    const money = (n) =>
        n === null || n === undefined
            ? null
            : new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: fees.currency || "GBP",
              }).format(n);

    return (
        <section>
            {/* ⚠️ See `FeatureMatrix` for why `headless` exists. Default false,
                so `Wishlist` and `vs/Generic` render exactly as before. */}
            {!headless && (
                <>
                    <Eyebrow accent={accent}>The money</Eyebrow>

                    <h2 className="mt-4 font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                        What a {money(fees.example_price)} payment really costs
                    </h2>

                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
                        Percentages next to percentages, flat fees next to flat
                        fees, every line for both of us. Ours are read live from
                        our checkout, so they can never drift from what a
                        supporter is charged.
                    </p>
                </>
            )}

            {/*
             * ── SPLIT DOWN THE MIDDLE ──────────────────────────────────
             *
             * 🚨 CLIENT DIRECTION, 29 Aug 2026: "Split them down the middle on
             * all comparison pages. So we can show the difference in cost. And
             * how small it is for the extra benefits we provide." Ours on the
             * left, theirs on the right, one rule between them.
             *
             * Before this the two halves were STACKED — our three rails across
             * the top, then a heading, then their fee rows underneath — so the
             * page asked the reader to scroll between the two things it was
             * comparing and hold one in their head. A comparison is read across,
             * not down.
             *
             * ⚠️ `lg:`, NOT `md:`. At 768 a half is ~350px, and their fee VALUES
             * run to three lines of prose at that width while our rail cards
             * carry a two-column figure list — both become unreadable before
             * they become side by side. Below `lg` the halves stack in the same
             * order, and their heading is what separates them.
             *
             * ⚠️ Our rails STACK inside their half rather than sitting three
             * across. Three cards in half the width was the same cramping in a
             * smaller box.
             */}
            <div className="mt-9 lg:grid lg:grid-cols-2 lg:gap-x-10">
                <div className="lg:pr-2">
                    <h3 className="mb-5 flex items-center gap-3 font-gulfs text-xl uppercase tracking-[0.08em] text-white md:text-2xl">
                        <span
                            className="h-[3px] w-8 shrink-0 rounded-full"
                            style={{ backgroundColor: "#05EFB8" }}
                        />
                        What we charge
                    </h3>

                    <div className="grid gap-3">
                        {fees.rails.map((rail) => (
                            <div
                                key={rail.key}
                                className="rounded-box-sm border border-white/15 px-5 py-6"
                            >
                                <div className="flex items-baseline justify-between gap-3">
                                    <h3 className="font-gulfs text-[15px] uppercase tracking-[0.1em] text-white">
                                        {rail.label}
                                    </h3>
                                    {rail.coming_soon && (
                                        <span className="rounded-box-xs bg-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-300">
                                            Coming soon
                                        </span>
                                    )}
                                </div>

                                <dl className="mt-5 space-y-2 text-[15px] leading-[1.5]">
                                    <Line
                                        label="Platform fee"
                                        value={`${rail.platform_rate}%`}
                                    />
                                    <Line
                                        label="Compliance fee"
                                        value={`${rail.compliance_rate}%`}
                                    />
                                    <Line
                                        label="Payment processing"
                                        value={
                                            rail.processing_rate === null
                                                ? rail.processing_note
                                                : `${rail.processing_rate}% + ${money(rail.processing_fixed)}`
                                        }
                                    />
                                </dl>

                                {/*
                                 * ⚠️ An all-in figure is shown ONLY when every part of it
                                 * is known. The announced rail has an unpublished
                                 * provider rate on top, so printing the two rates we do
                                 * know as a total would under-state our own cost — in our
                                 * favour, on the page whose whole claim is that it does
                                 * not do that.
                                 */}
                                {rail.all_in_rate !== null && (
                                    <p className="mt-5 border-t border-white/15 pt-4 font-gulfs text-[15px] uppercase tracking-[0.08em] text-white">
                                        ≈{rail.all_in_rate}% all-in
                                    </p>
                                )}

                                {rail.flat_fee !== null && (
                                    <p className="mt-3 text-[15px] text-gray-300">
                                        Plus {money(rail.flat_fee)} flat
                                    </p>
                                )}

                                {rail.supporter_pays !== null && (
                                    <p className="mt-5 border-t border-white/15 pt-4 text-[15px] leading-[1.5] text-gray-300">
                                        Supporter pays{" "}
                                        <strong className="text-white">
                                            {money(rail.supporter_pays)}
                                        </strong>
                                        <br />
                                        You receive{" "}
                                        <strong className="text-[#05EFB8]">
                                            {money(rail.creator_receives)}
                                        </strong>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="mt-5 text-[15px] leading-[1.55] text-gray-300">
                        {fees.lines.flat_fee}
                    </p>
                    <p className="mt-2 text-[15px] leading-[1.55] text-gray-300">
                        {fees.lines.creator}
                    </p>
                    {threeTierLine && (
                        <p className="mt-2 text-[15px] leading-[1.55] text-gray-300">
                            {threeTierLine}
                        </p>
                    )}
                </div>

                {/* ── Their half ─────────────────────────────────────────
                 *
                 * ⚠️ THE RULE IS THE SPLIT, and it is a `border-white/15`
                 * utility rather than the house `border-black` — that class is
                 * a 2px all-sides SHORTHAND in this project, so `lg:border-l`
                 * beside it would be discarded and the half would draw a box.
                 * `border-white/15` is Tailwind's real colour-only utility and
                 * composes with a side.
                 */}
                <div className="mt-12 border-t border-white/15 pt-10 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                    <h3 className="mb-5 flex items-center gap-3 font-gulfs text-xl uppercase tracking-[0.08em] text-white md:text-2xl">
                        <span className="h-[3px] w-8 shrink-0 rounded-full bg-white/30" />
                        What {competitor} charges
                    </h3>

                    {/*
                     * 🚨 ONE FRAME, ROWS SHARING HAIRLINES — not a card per fee. This
                     * was five to eight separate bordered boxes stacked down the page,
                     * each with its label on one line and its value on the next, so the
                     * competitor's whole fee structure read as a pile of unrelated
                     * notices and used barely half the width it had. It is one thing —
                     * what this platform charges — made of parts, which is the same
                     * argument (and the same `divide-y` device) as `Ledger.jsx`'s
                     * `LedgerFrame`: adjacent borders double up, a shared rule does not.
                     *
                     * ⚠️ Label LEFT, value RIGHT at `md:`. Every row's value used to
                     * begin at the frame's left edge under its own label, which left a
                     * ragged column of one-line headings above full-width paragraphs.
                     * Splitting them puts the eight labels on one spine a reader can
                     * scan, and gives the values the width they were wasting.
                     */}
                    <div className="overflow-hidden rounded-box border border-white/15">
                        <div className="divide-y divide-white/10">
                            {competitorFees.map((row) => (
                                <div
                                    key={row.label}
                                    className="px-5 py-5 md:px-6"
                                >
                                    <div>
                                        <h4 className="font-mono text-[11px] uppercase leading-[1.4] tracking-[0.12em] text-gray-400">
                                            {row.label}
                                        </h4>

                                        {row.notOnPricingPage && (
                                            <span className="mt-2 inline-block rounded-box-xs bg-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-gray-300">
                                                Not on their pricing page
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3">
                                        <p className="text-[15px] leading-[1.55] text-gray-200">
                                            {row.value}
                                        </p>

                                        <a
                                            href={row.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            className="mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                                        >
                                            Source
                                            {row.checkedOn
                                                ? ` · checked ${row.checkedOn}`
                                                : ""}{" "}
                                            →
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Line({ label, value }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <dt className="text-gray-400">{label}</dt>
            <dd className="text-right text-white">{value}</dd>
        </div>
    );
}
