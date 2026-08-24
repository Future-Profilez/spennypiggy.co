import { useEffect, useMemo, useState } from "react";

/**
 * How long the current board has left.
 *
 * Every period but lifetime is calendar bounded server-side
 * (`LeaderBoardController::periodWindow`), so this is a real deadline, not a
 * marketing device. A board that never closes is a table; the close is the only
 * thing that makes a rank worth defending this week rather than eventually.
 *
 * ⚠️ It renders NOTHING for the lifetime board — inventing a deadline for a
 * ranking that has none would be the page telling a creator something untrue.
 * ⚠️ `aria-live` is deliberately off: a region that re-announces every second is
 * unusable. The label carries the full sentence for assistive tech, and the
 * ticking figure is decorative repetition of it.
 */
const ONE_HOUR = 60 * 60 * 1000;

const FAST_TICK = 1000;

/**
 * 20s, not 60s: a 60s interval can land just after a minute boundary and leave
 * the figure a whole minute stale, which is visible on a countdown.
 */
const SLOW_TICK = 20000;

function parts(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));

    return {
        days: Math.floor(total / 86400),
        hours: Math.floor((total % 86400) / 3600),
        minutes: Math.floor((total % 3600) / 60),
        seconds: total % 60,
    };
}

export default function Countdown({ endsAt, periodLabel }) {
    const target = useMemo(() => (endsAt ? new Date(endsAt).getTime() : null), [endsAt]);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!target) return undefined;

        // ⚠️ Tick as fast as the SMALLEST UNIT ON SCREEN, no faster. Above an
        // hour the seconds are not rendered, so a 1s interval re-rendered this
        // component 3,600 times an hour to change nothing — on a page that also
        // mounts charts.
        const tick = () => {
            setNow(Date.now());
            const left = target - Date.now();

            return left > ONE_HOUR ? SLOW_TICK : FAST_TICK;
        };

        let timer;
        const schedule = (delay) => {
            timer = setTimeout(() => schedule(tick()), delay);
        };

        schedule(target - Date.now() > ONE_HOUR ? SLOW_TICK : FAST_TICK);

        return () => clearTimeout(timer);
    }, [target]);

    if (!target || Number.isNaN(target)) return null;

    const remaining = target - now;

    if (remaining <= 0) {
        return (
            <div className="mt-6 inline-flex items-center gap-2 rounded-box-sm border-black bg-brandYellow px-3.5 py-2 text-12 font-semibold uppercase tracking-[0.16em] text-black">
                Counting the final results
            </div>
        );
    }

    const { days, hours, minutes, seconds } = parts(remaining);

    // Under an hour the seconds are the story; above it they are noise that
    // makes the whole block twitch in the corner of the reader's eye.
    const cells =
        days > 0
            ? [
                  { value: days, unit: days === 1 ? "day" : "days" },
                  { value: hours, unit: "hrs" },
                  { value: minutes, unit: "min" },
              ]
            : hours > 0
              ? [
                    { value: hours, unit: "hrs" },
                    { value: minutes, unit: "min" },
                    { value: seconds, unit: "sec" },
                ]
              : [
                    { value: minutes, unit: "min" },
                    { value: seconds, unit: "sec" },
                ];

    const sentence = `${periodLabel ?? "This"} board closes in ${cells
        .map((c) => `${c.value} ${c.unit}`)
        .join(", ")}`;

    return (
        <div
            className="mt-6 inline-flex flex-wrap items-center gap-x-3 gap-y-2 rounded-box-sm border-black bg-brandYellow px-3.5 py-2 text-black"
            aria-label={sentence}
        >
            <span className="text-12 font-semibold uppercase tracking-[0.16em]">Closes in</span>

            <span className="flex items-baseline gap-2" aria-hidden="true">
                {cells.map((cell) => (
                    <span key={cell.unit} className="flex items-baseline gap-1">
                        <span className="font-gulfs text-19 leading-[1] tabular-nums">
                            {String(cell.value).padStart(2, "0")}
                        </span>
                        <span className="text-12 font-semibold uppercase tracking-[0.1em] text-black/70">
                            {cell.unit}
                        </span>
                    </span>
                ))}
            </span>
        </div>
    );
}
