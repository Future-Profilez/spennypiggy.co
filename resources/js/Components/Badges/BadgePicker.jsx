import { PRIDE_BADGES, prideGradient } from "@/constants/badges";

/**
 * The ONE badge picker. Rendered by the registration profile step and by
 * `/account`, so the two cannot offer different badges or different caps —
 * the category list had already drifted into two files before this existed.
 *
 * House rules this deliberately follows, all of which have bitten before:
 *  - a filled brand block takes BLACK type, never white (white on #FF007F is
 *    3.78:1 and fails AA; black is 5.56:1)
 *  - no shadow anywhere — `npm run check` fails the build on one
 *  - no scale on hover or press; brightness and opacity only
 *  - `border-[#000]` rather than `border-black`, which `index.css` redefines as
 *    a full `border` shorthand that silently resets the width beside it
 *  - 44px minimum touch target, because this ships inside a PWA
 */

/** The disc at the head of a chip: an emoji, or a pride flag drawn as stripes. */
function BadgeMark({ badge, selected }) {
    // 🚨 Inline style, never a class. Tailwind's JIT only sees literal class
    // strings, so `bg-[${gradient}]` emits NO CSS and the disc renders
    // transparent — the documented silent-absence trap.
    if (badge.colors) {
        return (
            <span
                aria-hidden="true"
                className="h-7 w-7 shrink-0 rounded-full border border-black/25 bg-cover"
                style={{ backgroundImage: prideGradient(badge.colors) }}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[15px] leading-[1] ${
                selected ? "bg-black/10" : "bg-black/[0.06]"
            }`}
        >
            {badge.emoji}
        </span>
    );
}

function BadgeChip({ badge, selected, blocked, accentHex, onToggle }) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            disabled={blocked}
            onClick={() => onToggle(badge.slug)}
            className={`flex min-h-[44px] items-center gap-2 rounded-full border-2 px-3 pr-4 text-[13px] font-semibold leading-[1.2] transition-[background-color,border-color,filter,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                selected
                    ? // Black type on the accent fill. The old chip used
                      // text-white here, which fails AA on brand pink.
                      "border-[#000] text-black hover:brightness-110 active:brightness-95"
                    : blocked
                      ? // A disabled control is exempt from the contrast floor
                        // and has to LOOK disabled — raising this made a chip
                        // you cannot press read as one you can.
                        "cursor-not-allowed border-black/10 bg-white text-black/40"
                      : "border-black/15 bg-white text-black/75 hover:border-black/40"
            }`}
            style={selected ? { backgroundColor: accentHex } : undefined}
        >
            <BadgeMark badge={badge} selected={selected} />
            <span>{badge.label}</span>
        </button>
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
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-black/70">
                    {title}
                </h3>

                {/* The count is the picker's own state, so it reads as a chip
                    rather than as a label — matches the reference artwork. */}
                <span
                    className="rounded-full border-2 border-black/15 px-2.5 py-0.5 text-[12px] font-semibold leading-[1.4]"
                    style={{ color: count ? accentHex : undefined }}
                >
                    {count} of {max} selected
                </span>

                {count > 0 && onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-[12px] font-semibold text-black/60 underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
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

            <div className="space-y-3">
                {groups.map((group) => (
                    <fieldset key={group.group}>
                        <legend className="sr-only">{group.group}</legend>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {showGroupNames && (
                                <span className="mr-1 w-full text-[12px] font-semibold uppercase tracking-[0.12em] text-black/55 sm:w-auto">
                                    {group.group}
                                </span>
                            )}

                            {group.items.map((badge) => {
                                const isSelected = selected.includes(
                                    badge.slug,
                                );

                                return (
                                    <BadgeChip
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
