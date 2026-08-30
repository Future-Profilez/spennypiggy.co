import { feeGaps, payRatio } from '../feeGap';

/**
 * The £20 snapshot — us against the competitor, high on the page.
 *
 * Client direction, 29 Aug 2026: "I want to show us vs the competition. So it's
 * clear to see. Like a small table addition high up at the top of the pages."
 *
 * 🚨 IT IS A TABLE BECAUSE THE ARGUMENT IS READ ACROSS A ROW. "You receive
 * £20.00 · £20.00 · $20.00, and here is what each one attaches to that" only
 * works when the three figures sit on ONE line. Drawn as three cards — the
 * shape every other block on this page already uses — those figures land at
 * three different heights and the reader has to hold two of them in their head
 * to compare the third. The full fee breakdown further down is unchanged and
 * stays: this is the headline of that argument, not a replacement for it.
 *
 * 🚨 OUR FIGURES ARE PRICED BY THE LIVE CHECKOUT ENGINE, exactly as the full
 * block below is — nothing here is typed. The competitor's come from its config
 * sheet, where each one is the arithmetic of that sheet's sourced fee rows.
 *
 * 🚨 THIS IS NOT A CURRENCY COMPARISON AND MUST NEVER READ AS ONE. Throne
 * prices in USD and we price in the creator's own currency, so setting $23.11
 * beside £27.45 as though one were "cheaper" would be false. What the table
 * compares is the SHAPE of each deal — does the creator end up with the price
 * they set, and what is attached to it. Where the currencies differ, the column
 * header carries the code and the note under the table says so in words.
 *
 * ⚠️ THE COMPETITOR'S CONDITIONS LINE IS NOT OPTIONAL, WHICH IS WHY IT IS A
 * TABLE ROW AND NOT A FOOTNOTE. On Throne the creator IS credited the full
 * $20.00; the smaller figure appears only after a withdrawal fee. Printing the
 * lower number without the condition that produces it is exactly the selective
 * quoting these pages exist to argue against, and a footnote is the format
 * people skip.
 *
 * ⚠️ TWO RENDERINGS, ONE DATA ARRAY. A four-column table at 390px is either
 * unreadable or a sideways scroll, and asking someone to swipe between the two
 * halves of a comparison defeats "clear to see". `columns` is built once and
 * drawn as a table at `md:` and up, and as one block per platform below it.
 * Never let the two drift into two sources of truth.
 */
export default function FeeSnapshot({ fees, competitor, example, accent }) {
    // Nothing to compare against — the page renders without the snapshot rather
    // than showing a column of blanks. A sheet with no `theirs` block has not
    // been researched yet, which is a different thing from a competitor that
    // charges nothing.
    if (!example?.theirs) {
        return null;
    }

    const ourCurrency = fees.currency || 'GBP';

    const money = (n) =>
        new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: ourCurrency,
        }).format(n);

    /*
     * ⚠️ A whole unit, no decimals — the label is "per £1", not "per £1.00".
     * `money(1)` renders the second, which reads as a price rather than as the
     * unit a ratio is measured against.
     */
    const unit = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: ourCurrency,
        maximumFractionDigits: 0,
    }).format(1);

    const listed = example.listed ?? fees.example_price;

    /*
     * ⚠️ An announced rail carries no supporter total and no creator figure —
     * there is no charge to compute — so it cannot be a column here. It is
     * still listed in full in the fee block below.
     */
    const ourColumns = fees.rails
        .filter((rail) => !rail.coming_soon)
        .map((rail) => ({
            key: rail.key,
            platform: 'Spenny Piggy',
            rail: rail.label,
            ours: true,
            supporter: money(rail.supporter_pays),
            creator: money(rail.creator_receives),
            /* 🚨 The whole argument in one line, and it is a fact the pricing
               engine guarantees rather than a claim we are making. */
            conditions: 'The price you listed, in full. No creator-side fees.',
            ratio: payRatio(rail.supporter_pays, rail.creator_receives),
        }));

    // Their currency is named only when it differs from ours, so the reader is
    // told plainly that the two columns are not subtractable.
    const theirCurrency =
        example.currency && example.currency !== ourCurrency
            ? example.currency
            : null;

    /*
     * 🚨 THE COST DIFFERENCE, AND IT NEEDS NO EXCHANGE RATE.
     *
     * Client direction, 29 Aug 2026: "show the difference in cost, and how small
     * it is for the extra benefits we provide." Subtracting $23.11 from £27.45 is
     * meaningless, and converting at a live rate puts a figure on the page that
     * moves daily and depends on a third party — on the one page whose claim is
     * that every number is sourced and stable.
     *
     * BOTH examples pay the creator exactly 20 of their own unit, so the ratio —
     * what a supporter pays per 1 the creator keeps — is currency-free, exact,
     * and directly comparable. Everything below is derived from it; no figure
     * here is typed, on either side.
     *
     * ⚠️ A competitor whose cells are PROSE (a link page quotes no number,
     * because it does not process the sale) has no ratio, and the whole
     * comparison row is then dropped rather than filled with a guess.
     */
    const theirRatio = payRatio(
        example.theirs.supporter_pays_amount,
        example.theirs.creator_receives_amount,
    );

    const columns = [
        ...ourColumns,
        {
            key: 'them',
            platform: competitor,
            rail: theirCurrency ? `Priced in ${theirCurrency}` : null,
            ours: false,
            supporter: example.theirs.supporter_pays,
            creator: example.theirs.creator_receives,
            conditions: example.theirs.conditions,
            ratio: theirRatio,
        },
    ];

    const comparable = theirRatio !== null && ourColumns.some((c) => c.ratio);

    /*
     * What the gap is worth on this page's own example sale, per rail. Stated in
     * OUR currency because it is our listed price being described — their column
     * is a ratio applied to it, never a converted total of theirs.
     */
    const gaps = feeGaps(ourColumns, theirRatio, listed);

    return (
        <section className="rounded-box border-black bg-[#111113] px-5 py-6 md:px-8 md:py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <h2 className="font-gulfs text-xl uppercase leading-[1.05] tracking-tight text-white md:text-[28px]">
                    A {money(listed)} sale, side by side
                </h2>
                <a
                    href="#the-money"
                    className="font-mono text-[11px] uppercase tracking-[0.14em] text-gray-400 underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                >
                    Every fee line →
                </a>
            </div>

            {/* ── The table, md and up ─────────────────────────────────── */}
            <table className="mt-7 hidden w-full table-fixed border-collapse text-left md:table">
                <caption className="sr-only">
                    What a {money(listed)} sale costs on Spenny Piggy and on{' '}
                    {competitor}
                </caption>

                <thead>
                    <tr>
                        {/* The stub head is empty on purpose: the row labels
                            below name themselves, and a word here ("Platform")
                            would be a fourth heading competing with the three
                            that carry meaning. */}
                        <th className="w-[22%] pb-4" />
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                /*
                                 * ⚠️ `align-top`, NOT `align-bottom`. A column
                                 * whose currency is not named (a competitor
                                 * priced in ours, or one that quotes no figure
                                 * at all) has no second line, and bottom-aligning
                                 * dropped its NAME onto the row where every other
                                 * column carries its sub-label — so "Linktree"
                                 * sat a line below "Spenny Piggy" beside it.
                                 * Aligning tops keeps the names on one line and
                                 * lets the sub-label hang where there is one.
                                 */
                                className="pb-4 pl-5 pr-5 align-top"
                            >
                                {/* 🚨 Mint on ours, white on theirs — the site's
                                    own "you receive" colour, carrying which side
                                    of the comparison each column is, rather than
                                    decorating it. An inline border: `border-black`
                                    is a 2px all-sides shorthand in this project,
                                    so a side rule can only be set inline. */}
                                <span
                                    className="mb-3 block h-[3px] w-8 rounded-full"
                                    style={{
                                        backgroundColor: col.ours
                                            ? '#05EFB8'
                                            : 'rgba(255,255,255,0.3)',
                                    }}
                                />
                                <span className="block font-gulfs text-[13px] uppercase leading-[1.2] tracking-[0.08em] text-white">
                                    {col.platform}
                                </span>
                                {col.rail && (
                                    <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-gray-400">
                                        {col.rail}
                                    </span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    <Row
                        label="Supporter pays"
                        columns={columns}
                        cell={(col) => col.supporter}
                    />

                    {/*
                     * 🚨 THE INVERTED ROW IS THE LINE THE READER LANDS ON, and
                     * it is the house device — `Ledger.jsx`'s `LedgerTotal`
                     * fills its foot for the same reason. There is exactly one
                     * on this table; a second would mean neither is the answer.
                     */}
                    <Row
                        label="You receive"
                        columns={columns}
                        cell={(col) => col.creator}
                        filled
                    />

                    {/*
                     * 🚨 THE ROW THAT MAKES THE TWO COLUMNS COMPARABLE. Every
                     * other figure on this table is in its own platform's
                     * currency; this one is a RATIO, so it is the only line a
                     * reader can honestly read across. It is also the client's
                     * "difference in cost", stated without an exchange rate.
                     */}
                    {comparable && (
                        <Row
                            label={`Per ${unit} you receive`}
                            columns={columns}
                            cell={(col) => (col.ratio ? money(col.ratio) : '—')}
                        />
                    )}

                    {/*
                     * ⚠️ `merge` COLLAPSES ADJACENT CELLS THAT SAY THE SAME
                     * THING. Our two rails carry one identical sentence, and
                     * printing it twice side by side halved its weight and read
                     * as a copy-paste slip. One statement for us, one for them,
                     * is also the shape of the argument. It merges on VALUE, so
                     * a rail whose terms ever differed would separate again on
                     * its own rather than quietly hiding the difference.
                     */}
                    <Row
                        label="Attached to it"
                        columns={columns}
                        cell={(col) => col.conditions}
                        merge
                        small
                    />
                </tbody>
            </table>

            {/* ── One block per platform, below md ─────────────────────── */}
            <div className="mt-6 grid gap-3 md:hidden">
                {columns.map((col) => (
                    <div
                        key={col.key}
                        className="rounded-box-sm border border-white/15 px-4 py-4"
                        style={
                            col.ours
                                ? { borderLeft: '3px solid #05EFB8' }
                                : undefined
                        }
                    >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <h3 className="font-gulfs text-[13px] uppercase tracking-[0.08em] text-white">
                                {col.platform}
                            </h3>
                            {col.rail && (
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-400">
                                    {col.rail}
                                </span>
                            )}
                        </div>

                        <dl className="mt-3.5 space-y-2">
                            <StackedLine
                                label="Supporter pays"
                                value={col.supporter}
                            />
                            {/*
                             * 🚨 MINT IS OURS. On the table the column rule
                             * carries which side each column is; here the card's
                             * left edge does. Setting the competitor's figure in
                             * mint too would put our colour on their claim and
                             * undo the one thing telling the two apart —
                             * measured on a phone, that is the only encoding
                             * left once the columns are stacked.
                             */}
                            <StackedLine
                                label="You receive"
                                value={col.creator}
                                strong
                                ours={col.ours}
                            />
                            {comparable && (
                                <StackedLine
                                    label={`Per ${unit} you receive`}
                                    value={col.ratio ? money(col.ratio) : '—'}
                                />
                            )}
                        </dl>

                        {col.conditions && (
                            <p className="mt-3.5 border-t border-white/10 pt-3 text-[13px] leading-[1.5] text-gray-400">
                                {col.conditions}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/*
             * 🚨 THE CLIENT'S SECOND HALF — "and how small it is for the extra
             * benefits we provide." The figure is derived from the ratio gap
             * applied to this page's own example sale, so it moves with the
             * live rates like everything else here.
             *
             * ⚠️ IT SAYS "MORE", NOT "ONLY". The page's own rule is that the
             * strongest wording permitted is factual — naming the gap and then
             * naming what it buys lets the reader draw the conclusion, which is
             * the argument these pages are built to win. Talking the number
             * down in our own voice is what makes a comparison page read as an
             * advert.
             */}
            {gaps.length > 0 && (
                <div
                    className="mt-7 pl-5 md:pl-6"
                    style={{ borderLeft: '3px solid #05EFB8' }}
                >
                    <p className="font-gulfs text-[13px] uppercase tracking-[0.1em] text-white">
                        The difference on a {money(listed)} sale
                    </p>
                    <p className="mt-2.5 text-[15px] leading-[1.6] text-gray-200">
                        {gaps.map((gap, i) => (
                            <span key={gap.key}>
                                {i > 0 && ', '}
                                <strong className="text-white">
                                    {money(Math.abs(gap.amount))}
                                </strong>{' '}
                                {gap.amount >= 0 ? 'more' : 'less'} on{' '}
                                {gap.rail}
                            </span>
                        ))}
                        {' — '}and this is what the difference buys:
                    </p>

                    {/*
                     * 🚨 A LIST, NOT A FIVE-ITEM RUN-ON SENTENCE. This is the
                     * second half of the client's direction — "how small it is
                     * FOR THE EXTRA BENEFITS WE PROVIDE" — and written as one
                     * comma-separated sentence the benefits were the part a
                     * reader skimmed, which leaves only the number that says we
                     * cost more. Exactly the fault "What it pays for" had.
                     *
                     * ⚠️ Five items, no more. This is the headline of the
                     * argument; the full account is `WhyTheFee` further down,
                     * and repeating all of it here would make the block longer
                     * than the table it is explaining.
                     */}
                    <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                        {[
                            'A delivery record on every sale',
                            'Dispute evidence gathered for you',
                            'A person reviewing each payment before payout',
                            'Weekly payouts from a registered business',
                            'Real people on live chat',
                        ].map((item) => (
                            <li
                                key={item}
                                className="flex gap-2.5 text-[14px] leading-[1.5] text-gray-300"
                            >
                                <span
                                    aria-hidden="true"
                                    className="mt-[8px] h-[5px] w-[5px] shrink-0 rounded-full"
                                    style={{ backgroundColor: '#05EFB8' }}
                                />
                                {item}
                            </li>
                        ))}
                    </ul>

                    <a
                        href="#the-money"
                        className="mt-3 inline-block text-[14px] text-gray-300 underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                    >
                        Every fee line is below
                    </a>
                </div>
            )}

            <p className="mt-6 max-w-3xl text-[13px] leading-[1.6] text-gray-400">
                Our figures are read live from our own checkout, so they cannot
                drift from what a supporter is charged.{' '}
                {theirCurrency
                    ? `${competitor}’s are in ${theirCurrency} and are the arithmetic of their own published fees. The two are not the same currency, so the totals are not subtractable — the “per ${unit} you receive” line is, and it is what the difference above is worked from.`
                    : `${competitor}’s are taken from their own published pages.`}
            </p>
        </section>
    );
}

/**
 * One row of the table.
 *
 * ⚠️ `align-top` on every cell. The conditions row runs to several lines in one
 * column and one line in another, and centring those would leave the short cells
 * floating in the middle of a tall row with nothing to sit on.
 */
function Row({
    label,
    columns,
    cell,
    filled = false,
    small = false,
    merge = false,
}) {
    const pad = small ? 'py-4' : 'py-3.5';

    // Adjacent columns whose cell reads the same become one cell. Without
    // `merge` every column keeps its own, which is the default.
    const groups = [];
    columns.forEach((col) => {
        const value = cell(col);
        const last = groups[groups.length - 1];
        if (merge && last && last.value === value) {
            last.span += 1;
            return;
        }
        groups.push({ key: col.key, value, span: 1 });
    });

    /*
     * ⚠️ THE FILL IS ON THE CELLS AS WELL AS THE ROW. A `<tr>` background is
     * painted behind cells that carry their own, and `table-fixed` column widths
     * land on subpixels — measured 244 + 288×3 against a 1107px table — so a
     * row-only fill left hairline dark seams between the cells of the one white
     * band on the page. Painting both makes the band solid at any width.
     */
    const fill = filled ? 'bg-white' : '';
    const rule = filled
        ? undefined
        : { borderTop: '1px solid rgba(255,255,255,0.12)' };

    return (
        <tr className={fill}>
            <th
                scope="row"
                className={`${pad} ${fill} pr-4 align-top font-mono text-[10px] font-normal uppercase tracking-[0.12em] ${
                    filled ? 'text-black/60' : 'text-gray-500'
                }`}
                style={rule}
            >
                {label}
            </th>

            {groups.map((group) => (
                <td
                    key={group.key}
                    colSpan={group.span}
                    className={`${pad} ${fill} pl-5 pr-5 align-top ${
                        small
                            ? 'text-[13px] leading-[1.5]'
                            : 'text-[17px] leading-[1.3]'
                    } ${
                        filled
                            ? 'font-semibold text-black'
                            : small
                              ? 'text-gray-400'
                              : 'text-white'
                    }`}
                    style={rule}
                >
                    {group.value}
                </td>
            ))}
        </tr>
    );
}

function StackedLine({ label, value, strong = false, ours = false }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                {label}
            </dt>
            <dd
                className={`text-right leading-[1.35] ${
                    strong
                        ? `text-[17px] font-semibold ${ours ? 'text-[#05EFB8]' : 'text-white'}`
                        : 'text-[15px] text-white'
                }`}
            >
                {value}
            </dd>
        </div>
    );
}
