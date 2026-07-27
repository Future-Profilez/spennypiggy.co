/**
 * Rows in the shape they will arrive in. The board used to dim itself to 50%
 * opacity while loading, which reads as "broken" rather than "loading".
 */
export default function BoardSkeleton({ rows = 8 }) {
    return (
        <div aria-busy="true" aria-label="Loading the leaderboard">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-2.5 border-b border-black/[0.06] px-3 py-3 last:border-b-0 sm:gap-4 sm:px-4 sm:py-3.5"
                >
                    <div className="w-8 shrink-0 sm:w-14" />
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-box-sm bg-black/[0.06]" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 animate-pulse rounded-full bg-black/[0.06]" />
                        <div className="h-2 w-1/2 animate-pulse rounded-full bg-black/[0.04]" />
                    </div>
                    <div className="h-9 w-16 shrink-0 animate-pulse rounded-full bg-black/[0.04]" />
                </div>
            ))}
        </div>
    );
}
