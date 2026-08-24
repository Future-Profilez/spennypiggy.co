import { PRIDE_BADGES, prideGradient } from "@/constants/badges";

/**
 * The ONE badge picker. Rendered by the registration profile step and by
 * `/account`, so the two cannot offer different badges or different caps —
 * the category list had already drifted into two files before this existed.
 *
 * 🚨 A GRID, not a flow of pills, and that is the design decision worth
 * keeping. 34 badges of wildly different name lengths ("AI" beside "Internet
 * Princess") in a `flex-wrap` produce ragged rows with a different number of
 * items on each, which reads as a wall of form controls rather than as a set
 * of things you can WEAR. `auto-fill` + `minmax` gives every badge the same
 * footprint and a straight right edge at every width, without anyone choosing
 * a column count per breakpoint.
 *
 * The icon carries the badge, so it is the biggest element in the tile — 34px
 * against the old 28px, on its own ring, with the label subordinate to it.
 *
 * House rules this follows, all of which have bitten before:
 *  - a filled brand block takes BLACK type, never white (white on #FF007F is
 *    3.78:1 and fails AA; black is 5.56:1)
 *  - no shadow anywhere — `npm run check` fails the build on one
 *  - no scale on hover or press; brightness, background and border only
 *  - `border-[#000]` rather than `border-black`, which `index.css` redefines as
 *    a full `border` shorthand that silently resets the width beside it
 *  - `rounded-box-sm`, the token for something sitting INSIDE a panel; the
 *    responsive value lives in `theme.css` and is never hardcoded here
 *  - 44px minimum touch target — the tile is 56px, comfortably over
 *  - `leading-[1.25]`, a RATIO: numeric `leading-N` is remapped to PIXELS by
 *    this project's Tailwind config, so `leading-5` would be a 5px line box
 */

/** ⚠️ A literal class string — a template-built one emits no CSS at all. */
const GRID = "grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2";

/** The disc: an emoji, or a pride flag drawn as stripes. */
function BadgeMark({ badge, selected }) {
    // 🚨 Inline style, never a class. Tailwind's JIT only sees literal class
    // strings, so `bg-[${gradient}]` emits NO CSS and the disc renders
    // transparent — the documented silent-absence trap.
    if (badge.colors) {
        return (
            <span
                aria-hidden="true"
                className={`h-[34px] w-[34px] shrink-0 rounded-full border-2 bg-cover ${
                    selected ? "border-[#000]" : "border-black/15"
                }`}
                style={{ backgroundImage: prideGradient(badge.colors) }}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border-2 text-[17px] leading-[1] ${
                selected
                    ? // White disc on the accent fill. The emoji keeps its own
                      // colours, so it needs a light ground to read against
                      // pink — on a 10%-black wash it went muddy.
                      "border-[#000] bg-white"
                    : "border-black/10 bg-black/[0.04]"
            }`}
        >
            {badge.emoji}
        </span>
    );
}

function BadgeTile({ badge, selected, blocked, accentHex, onToggle }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            disabled={blocked}
            onClick={() => onToggle(badge.slug)}
            title={badge.label}
            className={`flex min-h-[56px] items-center gap-2.5 rounded-box-sm border-2 px-2.5 py-2 text-left transition-[background-color,border-color,opacity,filter] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 ${
                selected
                    ? "border-[#000] text-black hover:brightness-[1.06] active:brightness-95"
                    : blocked
                      ? // A disabled control is exempt from the contrast floor
                        // and has to LOOK disabled — the old muted-text version
                        // read as a tile you could still press.
                        "cursor-not-allowed border-black/10 bg-black/[0.02] opacity-45"
                      : "border-black/[0.14] bg-black/[0.02] text-black/80 hover:border-black/40 hover:bg-black/[0.05]"
            }`}
            style={selected ? { backgroundColor: accentHex } : undefined}
        >
            <BadgeMark badge={badge} selected={selected} />

            {/* Two lines allowed: at two columns on a 390px screen "Internet
                Princess" cannot fit on one, and truncating a badge to
                "Internet Prince…" is worse than wrapping it. */}
            <span className="line-clamp-2 text-[12.5px] font-semibold leading-[1.25]">
                {badge.label}
            </span>
        </button>
    );
}

/** Group name + a rule running to the edge — cheap rhythm, one thin row. */
function GroupRule({ children }) {
    return (
        <div className="mb-2 mt-1 flex items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/45">
                {children}
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-black/[0.09]" />
        </div>
    );
}

/**
 * @param {{group: string, items: Array}[]} groups  render order IS this order
 * @param {string[]} selected  slugs
 * @param {boolean} showGroupNames  false for the pride set, which is one list
 */
export default function BadgePicker({
    title,
    hint,
    groups,
    selected = [],
    onToggle,
    onClear,
    max,
    accentHex = "#FF007F",
    showGroupNames = true,
}) {
    const count = selected.length;
    const atLimit = count >= max;

    return (
        <section>
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-black">
                    {title}
                </h3>

                {/* Filled once something is picked, so the count reads as state
                    rather than as a label. Black on the accent, per the house
                    contrast rule — this is a filled brand block like any other. */}
                <span
                    className={`rounded-full border-2 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] leading-[1.5] ${
                        count
                            ? "border-[#000] text-black"
                            : "border-black/15 text-black/50"
                    }`}
                    style={count ? { backgroundColor: accentHex } : undefined}
                >
                    {count} / {max}
                </span>

                {count > 0 && onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="ml-auto text-[12px] font-semibold text-black/55 underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                        Clear
                    </button>
                )}
            </div>

            {hint && (
                <p className="mb-3 text-[12px] leading-[1.5] text-black/55">
                    {hint}
                </p>
            )}

            {atLimit && (
                // Without this the remaining tiles simply go flat and nothing
                // says why — the old picker disabled 28 of them in silence.
                <p className="mb-3 text-[12px] font-semibold leading-[1.5] text-black/60">
                    That&rsquo;s all {max}. Remove one to swap it out.
                </p>
            )}

            <div className="space-y-1">
                {groups.map((group) => (
                    <fieldset key={group.group}>
                        <legend className="sr-only">{group.group}</legend>

                        {showGroupNames && <GroupRule>{group.group}</GroupRule>}

                        <div className={GRID}>
                            {group.items.map((badge) => {
                                const isSelected = selected.includes(
                                    badge.slug,
                                );

                                return (
                                    <BadgeTile
                                        key={badge.slug}
                                        badge={badge}
                                        selected={isSelected}
                                        blocked={atLimit && !isSelected}
                                        accentHex={accentHex}
                                        onToggle={onToggle}
                                    />
                                );
                            })}
                        </div>
                    </fieldset>
                ))}
            </div>
        </section>
    );
}

/** The pride set is one flat list, so it gets its own thin wrapper. */
export function PrideBadgePicker(props) {
    return (
        <BadgePicker
            {...props}
            showGroupNames={false}
            groups={[{ group: "Pride badges", items: PRIDE_BADGES }]}
        />
    );
}
