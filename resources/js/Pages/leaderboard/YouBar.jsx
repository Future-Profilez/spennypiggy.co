import { Share2Icon } from "lucide-react";
import MovementChip from "./MovementChip";
import { nextBand, rankTier } from "./rankTier";

/**
 * The viewer's own standing, pinned where a thumb can reach it.
 *
 * Resolved server-side from the whole board, so it is correct at rank 412 —
 * a rank you have to scroll to find is a rank the page never told you.
 *
 * The gap to the next position is stated in supporters, never money: the board
 * ranks reach, and the amounts are deliberately not public.
 */
export default function YouBar({ you, windowDays, onShare }) {
    if (!you) return null;

    const next = you.next;
    const tier = rankTier(you.top);
    const climbing = nextBand(you.top);

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+84px)] sm:pb-[calc(env(safe-area-inset-bottom)+20px)]">
            <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-4 rounded-box border border-black/[0.08] bg-white/85 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_56px_-28px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="shrink-0 text-center">
                    <span className="block font-gulfs text-28 leading-none text-[#0B0B0C] sm:text-32">
                        {you.rank}
                    </span>
                    <span className="mt-1 block text-9 font-semibold uppercase tracking-[0.2em] text-black/35">
                        of {you.total}
                    </span>
                </div>

                <span aria-hidden="true" className="h-10 w-px shrink-0 bg-black/[0.08]" />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {tier.label && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-11 font-semibold uppercase tracking-[0.1em] ${tier.className}`}
                            >
                                {tier.label}
                            </span>
                        )}
                        <MovementChip direction={you.direction} delta={you.delta} windowDays={windowDays} compact />
                    </div>
                    <p className="mt-1 truncate text-12 text-black/55">
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

                <button
                    onClick={onShare}
                    className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-[#0B0B0C] px-5 text-11 font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-85"
                >
                    <Share2Icon size={13} strokeWidth={2.5} aria-hidden="true" />
                    Share
                </button>
            </div>
        </div>
    );
}
