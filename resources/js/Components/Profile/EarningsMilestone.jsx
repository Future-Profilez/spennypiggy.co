import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Total earned against the creator's live goal — the same figures MyGoal reads
 * from`/user/tip/goal/{username}`, told as a climb instead of a plain bar.
 *
 * The amount counts up and the track fills only once the block is on screen, so
 * the number arriving is what catches the eye. With reduced motion the final
 * state is what paints first — nothing here hides content behind an animation.
 */
export default function EarningsMilestone({ IsloggedIn, compact = false }) {
    const { user } = usePage().props;
    const { formatMultiPrice } = PriceFormat();

    const [goal, setGoal] = useState(null);
    const ref = useRef(null);
    const [live, setLive] = useState(prefersReducedMotion());
    const [shown, setShown] = useState(0);

    useEffect(() => {
        let cancelled = false;
        axios
            .get(`/user/tip/goal/${user?.username}`)
            .then((resp) => {
                if (!cancelled) setGoal(resp.data.goal);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [user?.username]);

    // Start when seen — a bar that finished animating off-screen is just a bar.
    useEffect(() => {
        if (prefersReducedMotion() || !ref.current) return;
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setLive(true);
                    io.disconnect();
                }
            },
            { threshold: 0.35 },
        );
        io.observe(ref.current);

        return () => io.disconnect();
    }, [goal]);

    const earned = Number(goal?.fullfilled) || 0;
    const target = Number(goal?.target) || 0;

    useEffect(() => {
        if (!live || prefersReducedMotion()) {
            setShown(earned);

            return;
        }
        if (earned <= 0) return;

        let raf;
        const start = performance.now();
        const DURATION = 1100;
        const tick = (now) => {
            const t = Math.min(1, (now - start) / DURATION);
            setShown(earned * (1 - Math.pow(1 - t, 3)));
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(raf);
    }, [live, earned]);

    if (!goal || target <= 0) return null;

    const pct = Math.min(100, Math.max(0, (earned / target) * 100));
    const remaining = Math.max(0, target - earned);
    const complete = remaining <= 0;
    const fill = live ? pct : 0;

    return (
        <div ref={ref} className="relative">
            <style>{`
                @keyframes spgSheen { 0% { transform: translateX(-120%) } 60%, 100% { transform: translateX(320%) } }
                @keyframes spgHop { 0%, 100% { transform: translate(-50%, 0) } 50% { transform: translate(-50%, -3px) } }
`}</style>

            <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                        Total earned
                    </span>
                    <span
                        className={`mt-1 block font-black leading-none tabular-nums text-black ${compact ? "text-2xl" : "text-3xl xl:text-[38px]"}`}
                    >
                        {formatMultiPrice(Math.round(shown), goal?.currency)}
                    </span>
                </div>
                <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black tabular-nums ${
                        complete
                            ? "border-[#12A150]/30 bg-[#12A150]/10 text-[#12A150]"
                            : "border-[#FF007F]/25 bg-[#FF007F]/10 text-[#FF007F]"
                    }`}
                >
                    {complete ? "Goal met" : `${Math.round(pct)}%`}
                </span>
            </div>

            <div className="relative mt-4">
                <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-black/5">
                    <div
                        className={`relative h-full rounded-full transition-[width] duration-[1100ms] ease-out ${
                            complete
                                ? "bg-gradient-to-r from-[#12A150] to-[#5BD48A]"
                                : "bg-gradient-to-r from-[#FF007F] via-[#FF4FA3] to-[#FF9CC8]"
                        }`}
                        style={{ width: `${fill}%` }}
                    >
                        <span
                            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                            style={{
                                animation: "spgSheen 2.8s ease-in-out infinite",
                            }}
                            aria-hidden="true"
                        />
                    </div>
                </div>

                <span
                    className="pointer-events-none absolute -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-white text-xs transition-[left] duration-[1100ms] ease-out"
                    style={{
                        left: `${Math.min(97, Math.max(3, fill))}%`,
                        transform: "translateX(-50%)",
                        animation: live
                            ? "spgHop 2.4s ease-in-out 1.2s infinite"
                            : undefined,
                    }}
                    aria-hidden="true"
                >
                    🐷
                </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-3 text-[11px] font-semibold">
                <span className="text-gray-500">
                    {complete ? (
                        <span className="font-black text-[#12A150]">
                            {formatMultiPrice(target, goal?.currency)} goal
                            reached
                        </span>
                    ) : (
                        <>
                            <span className="font-black tabular-nums text-black">
                                {formatMultiPrice(remaining, goal?.currency)}
                            </span>
                            {" "}
                            to {formatMultiPrice(target, goal?.currency)}
                        </>
                    )}
                </span>
                {IsloggedIn && (
                    <span className="shrink-0 text-gray-500">
                        Target rises when met
                    </span>
                )}
            </div>
        </div>
    );
}
