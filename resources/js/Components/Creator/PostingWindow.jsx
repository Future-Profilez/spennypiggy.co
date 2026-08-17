/**
 * The 30-day posting window, drawn as a window.
 *
 * ⚠️ Deliberately NOT a progress bar. A bar says "fill it and you're done", and
 * that is the one thing this rule does not mean: the window ROLLS, so a post
 * counting today drops out of it on a known date and the creator's total falls by
 * one. A creator at 3 of 3 is 3 of 3 *until* their oldest post ages out — and
 * that date is the only thing on this page they can act on early.
 *
 * Each post is a mark on the track, sliding left toward the edge it falls off.
 */
const DAY = 1000 * 60 * 60 * 24;

const daysUntil = (iso) => {
    if (!iso) return null;
    const then = new Date(iso);
    if (isNaN(then)) return null;
    return Math.max(0, Math.ceil((then - Date.now()) / DAY));
};

export default function PostingWindow({
    posts = [],
    required = 3,
    windowDays = 30,
    tone = "safe",
}) {
    // Semantic, and separate from the brand accent: the pink is the action, not
    // the state.
    const TONES = {
        safe: { mark: "bg-[#A2E4B8]", rail: "bg-[#A2E4B8]/25" },
        risk: { mark: "bg-[#E6EA7B]", rail: "bg-[#E6EA7B]/30" },
        paused: { mark: "bg-[#FF3B30]", rail: "bg-[#FF3B30]/20" },
    };
    const t = TONES[tone] ?? TONES.safe;

    const oldest = posts[0];
    const dropDays = oldest ? daysUntil(oldest.drops_out_at) : null;

    // ⚠️ Posts published in one sitting share almost the same position, and at 16px
    // a mark is ~5% of the track — three of them stack into one dot while the
    // header says 3 / 3, which is exactly the claim this component makes and fails.
    // Marks are nudged apart just enough to stay countable; the track is a
    // relationship, not a measurement, so a few percent of drift costs nothing.
    const MIN_GAP = 5;
    let previous = -Infinity;
    const marks = posts.map((post, i) => {
        const wanted = Math.min(97, Math.max(3, post.position ?? 0));
        const left = Math.min(97, Math.max(wanted, previous + MIN_GAP));
        previous = left;
        return { key: post.at ?? i, left };
    });

    // ⚠️ Several posts can age out on the same day — the same one-sitting pattern.
    // Saying "you'll be on 2 of 3" when all three leave together understates a
    // pause that is about to happen, in the sentence written to warn about it.
    const dropDay = (iso) => (iso ? String(iso).slice(0, 10) : null);
    const leavingTogether = oldest
        ? posts.filter((p) => dropDay(p.drops_out_at) === dropDay(oldest.drops_out_at))
              .length
        : 0;
    const remaining = Math.max(0, posts.length - leavingTogether);
    const noun = leavingTogether === 1 ? "post" : "posts";

    return (
        <div className="rounded-box border-[3px] border-black bg-white p-4 md:p-5">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12px] font-black uppercase tracking-[0.18em] text-black/60">
                    Last {windowDays} days
                </p>
                <p className="font-gulfs text-[15px] leading-none tabular-nums text-black">
                    {posts.length}
                    <span className="text-black/60"> / {required}</span>
                </p>
            </div>

            {/* The track. Left edge is where posts fall out, right edge is today. */}
            <div className="relative mt-5 mb-2 h-8">
                <div
                    className={`absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full border-[3px] border-black ${t.rail}`}
                />

                {marks.map((mark) => (
                    <span
                        key={mark.key}
                        aria-hidden="true"
                        className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-black ${t.mark}`}
                        style={{ left: `${mark.left}%` }}
                    />
                ))}

                {posts.length === 0 && (
                    <p className="absolute inset-0 flex items-center justify-center text-[12px] font-bold uppercase tracking-widest text-black/60">
                        Nothing counted yet
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-widest text-black/60">
                <span>Drops off</span>
                <span>Today</span>
            </div>

            {/* The sentence a bar cannot say. */}
            {oldest && dropDays !== null && (
                <p className="mt-3 border-t-[3px] border-black/10 pt-3 text-[13px] font-medium leading-snug text-black/75">
                    {dropDays === 0 ? (
                        <>
                            {leavingTogether > 1
                                ? `Your ${leavingTogether} oldest ${noun} leave`
                                : "Your oldest post leaves"}{" "}
                            the window <strong className="text-black">today</strong> —
                            you&rsquo;ll be on {remaining} of {required}.
                        </>
                    ) : (
                        <>
                            {leavingTogether > 1
                                ? `Your ${leavingTogether} oldest ${noun} leave`
                                : "Your oldest post leaves"}{" "}
                            the window in{" "}
                            <strong className="text-black tabular-nums">
                                {dropDays} {dropDays === 1 ? "day" : "days"}
                            </strong>
                            . You&rsquo;ll be on {remaining} of {required} then.
                        </>
                    )}
                </p>
            )}
        </div>
    );
}
