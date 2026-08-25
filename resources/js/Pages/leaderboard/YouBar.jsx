import { Share2Icon } from "lucide-react";
import { Link } from "@inertiajs/react";
import MovementChip from "./MovementChip";
import { nextBand, rankTier } from "./rankTier";

/**
 * Where the viewer stands, pinned where a thumb can reach it.
 *
 * ONE bar, three readers, in priority order:
 *   1. a CREATOR on the board — their rank, resolved server-side from the whole
 *      board so it is correct at 412; a rank you have to scroll to find is a
 *      rank the page never told you.
 *   2. a SUPPORTER — their place in the supporter ranking. The sidebar lists the
 *      top five and a reader outside that five had no way to know they were on
 *      the list at all.
 *   3. a GUEST — the page's only reason to sign up. A logged-out visitor read
 *      the whole board and was never once told they could be on it.
 *
 * 🚨 Every gap on this bar is stated in SUPPORTERS or PURCHASES, never money.
 * The board ranks reach and the amounts are deliberately not public.
 *
 * ⚠️ Black on brand pink, never white — 5.56:1 against 3.78:1. And no backdrop
 * blur behind a 2px black frame: the frame is what separates the bar from the
 * board scrolling under it, and a translucent ground undoes it.
 */
function Shell({ children }) {
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+84px)] sm:pb-[calc(env(safe-area-inset-bottom)+20px)]">
            <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-4 rounded-box border-black bg-white px-4 py-3">
                {children}
            </div>
        </div>
    );
}

function Figure({ value, caption }) {
    return (
        <div className="shrink-0 text-center">
            <span className="block font-gulfs text-28 leading-[1] text-black sm:text-32">{value}</span>
            <span className="mt-1 block text-12 font-semibold uppercase tracking-[0.2em] text-black/70">
                {caption}
            </span>
        </div>
    );
}

const RULE = <span aria-hidden="true" className="h-10 w-0.5 shrink-0 bg-black/15" />;

const ACCENT_BUTTON =
    "flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border-black bg-brandPink px-5 text-12 font-semibold uppercase tracking-[0.12em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95";

export default function YouBar({ you, supporter = null, isGuest = false, windowDays, onShare }) {
    if (you) {
        const next = you.next;
        const tier = rankTier(you.top);
        const climbing = nextBand(you.top);

        return (
            <Shell>
                <Figure value={you.rank} caption={`of ${you.total}`} />
                {RULE}

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {tier.label && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-12 font-semibold uppercase tracking-[0.1em] ${tier.className}`}
                            >
                                {tier.label}
                            </span>
                        )}
                        <MovementChip direction={you.direction} delta={you.delta} windowDays={windowDays} compact />
                    </div>
                    <p className="mt-1 truncate text-13 text-black/70">
                        {next
                            ? next.supporters_gap > 0
                                ? `${next.supporters_gap} more ${
                                      next.supporters_gap === 1 ? "supporter" : "supporters"
                                  } to pass @${next.username}`
                                : `Level with @${next.username} — next support moves you up`
                            : "You are top of the board"}
                        {climbing && next ? ` · next band ${climbing}` : ""}
                    </p>
                </div>

                <button onClick={onShare} className={ACCENT_BUTTON}>
                    <Share2Icon size={13} strokeWidth={2.5} aria-hidden="true" />
                    Share
                </button>
            </Shell>
        );
    }

    if (supporter) {
        const next = supporter.next;

        return (
            <Shell>
                <Figure value={supporter.rank} caption={`of ${supporter.total}`} />
                {RULE}

                <div className="min-w-0 flex-1">
                    <p className="text-13 font-semibold tracking-tight text-black">
                        {supporter.purchases} {supporter.purchases === 1 ? "purchase" : "purchases"} — you are
                        #{supporter.rank} supporter
                    </p>
                    <p className="mt-0.5 truncate text-13 text-black/70">
                        {next
                            ? next.purchases_gap > 0
                                ? `${next.purchases_gap} more ${
                                      next.purchases_gap === 1 ? "purchase" : "purchases"
                                  } to pass @${next.username}`
                                : `Level with @${next.username} — your next purchase moves you up`
                            : "You are top of the supporter board"}
                    </p>
                </div>

                <Link href="/discover" className={ACCENT_BUTTON}>
                    Discover
                </Link>
            </Shell>
        );
    }

    if (isGuest) {
        return (
            <Shell>
                <div className="min-w-0 flex-1">
                    <p className="text-14 font-semibold tracking-tight text-black">Get on this board</p>
                    <p className="mt-0.5 truncate text-13 text-black/70">
                        Creators are ranked by the supporters backing them. Yours starts at one.
                    </p>
                </div>

                <Link href={route("register")} className={ACCENT_BUTTON}>
                    Start a page
                </Link>
            </Shell>
        );
    }

    return null;
}
