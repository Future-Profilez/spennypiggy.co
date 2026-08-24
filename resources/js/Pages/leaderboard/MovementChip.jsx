import { ArrowDownIcon, ArrowUpIcon, MinusIcon, SparklesIcon } from "lucide-react";

/**
 * How far a creator moved since the last capture.
 *
 * Up is mint, new is pink, and both take black type inside the house 2px
 * frame. Down stays UNFILLED — a creator who slipped two places has not done
 * anything wrong, and giving that a colour of its own reads as a telling-off.
 * "New" is its own state: arriving on the board and holding your place are
 * different events, and a 0 would flatten them into the same thing.
 *
 * ⚠️ `border-black` is a 2px `border` shorthand here — no width class beside it.
 */
const STATES = {
    up: {
        Icon: ArrowUpIcon,
        className: "border-black bg-mint text-black",
        label: (delta) => `Up ${delta}`,
    },
    down: {
        Icon: ArrowDownIcon,
        className: "border-black bg-white text-black/70",
        label: (delta) => `Down ${delta}`,
    },
    same: {
        Icon: MinusIcon,
        className: "border-black bg-white text-black/70",
        label: () => "Held position",
    },
    new: {
        Icon: SparklesIcon,
        className: "border-black bg-brandPink text-black",
        label: () => "New on the board",
    },
};

export default function MovementChip({ direction, delta = 0, windowDays, compact = false, onColor = false }) {
    const state = STATES[direction];

    if (!state) return null;
    if (direction === "same" && compact) return null;

    const { Icon, label } = state;

    // 🚨 On a brand-coloured ground the chip drops to white. A pink "New" chip
    // sitting on the pink first-place card is the same colour as the thing it is
    // supposed to stand out from — only the 2px frame separated them, and the
    // mint "up" chip did the identical thing on second place.
    const className = onColor ? "border-black bg-white text-black" : state.className;
    const text = label(delta);
    const title = windowDays ? `${text} in the last ${windowDays} days` : text;

    return (
        <span
            title={title}
            aria-label={title}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-12 font-semibold leading-none ${className}`}
        >
            <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
            {direction === "new" ? "New" : direction === "same" ? "Held" : delta}
        </span>
    );
}
