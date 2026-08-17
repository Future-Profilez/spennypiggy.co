import { ArrowDownIcon, ArrowUpIcon, MinusIcon, SparklesIcon } from "lucide-react";

/**
 * How far a creator moved since the last capture.
 *
 * Down is grey, never red — a creator who slipped two places has not done
 * anything wrong, and colouring it as an error reads as a telling-off.
 * "New" is its own state: arriving on the board and holding your place are
 * different events, and a 0 would flatten them into the same thing.
 */
const STATES = {
    up: {
        Icon: ArrowUpIcon,
        className: "text-emerald-700 bg-emerald-600/[0.08] ring-emerald-600/20",
        label: (delta) => `Up ${delta}`,
    },
    down: {
        Icon: ArrowDownIcon,
        className: "text-black/60 bg-black/[0.03] ring-black/[0.08]",
        label: (delta) => `Down ${delta}`,
    },
    same: {
        Icon: MinusIcon,
        className: "text-black/60 bg-transparent ring-black/[0.07]",
        label: () => "Held position",
    },
    new: {
        Icon: SparklesIcon,
        className: "text-brandPink bg-brandPink/[0.07] ring-brandPink/20",
        label: () => "New on the board",
    },
};

export default function MovementChip({ direction, delta = 0, windowDays, compact = false }) {
    const state = STATES[direction];

    if (!state) return null;
    if (direction === "same" && compact) return null;

    const { Icon, className, label } = state;
    const text = label(delta);
    const title = windowDays ? `${text} in the last ${windowDays} days` : text;

    return (
        <span
            title={title}
            aria-label={title}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-12 font-semibold leading-none ring-1 ring-inset ${className}`}
        >
            <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
            {direction === "new" ? "New" : direction === "same" ? "Held" : delta}
        </span>
    );
}
