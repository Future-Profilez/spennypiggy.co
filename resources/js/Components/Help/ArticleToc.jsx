import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, List } from "lucide-react";

/**
 * "On this page" — as a desktop rail and as a phone bar, from one source.
 *
 * The static box this replaces listed the headings and then said nothing more:
 * on a long answer a reader four screens down had no idea which section they
 * were in, how much was left, or how to get back up without flicking. Both
 * forms here track the reading position, so the contents answers "where am I"
 * as well as "what is here".
 *
 * 🚨 IN THE FLOW OR STICKY AT THE TOP — NEVER PINNED TO THE FOOT. The phone tab
 * bar is `position: fixed; z-index: 999999` and the Intercom launcher is higher
 * still, so anything at the bottom of a phone screen is under one of them. The
 * bar here sticks directly beneath the site header (`help-sticky-top`, whose
 * offset is defined once in help.css beside the heading `scroll-margin-top` that
 * has to match it) and the rail sticks at the top of a desktop column.
 *
 * ⚠️ EVERY BROWSER READ IS IN AN EFFECT OR A HANDLER. SSR is on for /help, so
 * `document`, `window` and `IntersectionObserver` at module scope or during
 * render would take the render host down rather than one component.
 */

/**
 * Which heading is being read, and how far through the answer we are.
 *
 * ⚠️ TWO MECHANISMS, DELIBERATELY, because they answer different questions and
 * each is wrong on its own here:
 *   - IntersectionObserver says which heading is on screen. It is the accurate
 *     one, and it reports NOTHING while a long section's heading is scrolled
 *     past the top — which is most of the time on a long article.
 *   - The scroll fallback picks the last heading above the fold, which covers
 *     exactly that gap.
 * The observer wins when it has an answer.
 */
export function useReadingPosition(toc, articleRef) {
    const [activeId, setActiveId] = useState(null);
    const [progress, setProgress] = useState(0);

    const ids = useMemo(() => (toc ?? []).map((h) => h.id).filter(Boolean), [toc]);

    useEffect(() => {
        if (ids.length === 0) return undefined;

        const headings = ids
            .map((id) => document.getElementById(id))
            .filter(Boolean);

        if (headings.length === 0) return undefined;

        let frame = 0;
        let timer = 0;
        let ticking = false;
        let visible = new Set();

        const recalc = () => {
            // Progress: how far the article's own box has passed the fold.
            const el = articleRef?.current;
            if (el) {
                const rect = el.getBoundingClientRect();
                const total = rect.height - window.innerHeight;
                const done = total > 0 ? (-rect.top / total) * 100 : 100;
                setProgress(Math.min(100, Math.max(0, done)));
            }

            if (visible.size > 0) {
                // The topmost heading currently on screen, in document order.
                const first = headings.find((h) => visible.has(h.id));
                if (first) {
                    setActiveId(first.id);

                    return;
                }
            }

            // Nothing on screen: the last heading we have scrolled past.
            const offset = 140;
            let current = null;
            for (const h of headings) {
                if (h.getBoundingClientRect().top <= offset) current = h.id;
            }
            setActiveId(current ?? headings[0].id);
        };

        /*
         * 🚨 requestAnimationFrame ALONE WEDGES THIS PERMANENTLY.
         *
         * A rAF callback is throttled to ZERO in a background tab, in an
         * occluded iframe, and under some low-power modes — so a "skip if one is
         * already pending" flag never clears, every later scroll returns early,
         * and the contents bar silently stops tracking for the rest of the
         * session. Nothing errors and the component still renders, which is why
         * it took a scroll measurement to find: the label simply stayed on the
         * first heading for ever.
         *
         * The timer is the floor. Whichever fires first runs the work and
         * releases the flag; the other finds it already released and does
         * nothing, so the recalc never runs twice for one scroll.
         */
        const run = () => {
            ticking = false;
            recalc();
        };

        const schedule = () => {
            if (ticking) return;
            ticking = true;

            if (typeof window.requestAnimationFrame === "function") {
                frame = window.requestAnimationFrame(run);
            }

            timer = window.setTimeout(() => {
                if (!ticking) return;
                if (frame) window.cancelAnimationFrame(frame);
                run();
            }, 180);
        };

        let observer = null;
        if (typeof window.IntersectionObserver === "function") {
            observer = new window.IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) visible.add(entry.target.id);
                        else visible.delete(entry.target.id);
                    }
                    schedule();
                },
                // The band is the readable middle of the screen: a heading is
                // "current" once it is under the header and until it leaves the
                // lower third, which is where the eye actually is.
                { rootMargin: "-160px 0px -55% 0px", threshold: 0 },
            );

            headings.forEach((h) => observer.observe(h));
        }

        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
        schedule();

        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            if (timer) window.clearTimeout(timer);
            observer?.disconnect();
            visible = new Set();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
        };
    }, [ids, articleRef]);

    /*
     * ⚠️ The jump belongs to the hook, so both forms share ONE definition and
     * the one that is on screen is the one that updates. It used to be a second
     * hook each form called separately.
     */
    const jump = useCallback(
        (e, id) => {
            const target = typeof document !== "undefined" ? document.getElementById(id) : null;
            if (!target) return; // Let the browser follow the href.

            e.preventDefault();

            // ⚠️ `prefers-reduced-motion` is honoured: a smooth scroll across a
            // long article is exactly the motion that setting asks us to drop.
            const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
            target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });

            // The hash still changes, so the position is shareable and Back works.
            if (window.history?.replaceState) {
                window.history.replaceState(null, "", `#${id}`);
            }

            setActiveId(id);
        },
        [],
    );

    return { activeId, progress, jump };
}

/**
 * Desktop: a quiet sticky rail beside the answer.
 *
 * 🚨 IT TAKES THE POSITION, IT DOES NOT MEASURE IT. Both forms of the contents
 * are MOUNTED at every width — `hidden lg:block` and `lg:hidden` hide a rendered
 * element, they do not skip it — so a hook in each ran two IntersectionObservers
 * and two scroll/resize listener pairs over the same headings for the whole
 * session, one of them for a rail nobody could see. The page owns one
 * `useReadingPosition` and hands it down.
 */
export function ArticleTocRail({ toc = [], activeId, onJump, className = "" }) {
    if (toc.length < 2) return null;

    return (
        <nav aria-label="On this page" className={className}>
            <p className="font-gulfs text-[11px] uppercase tracking-[0.18em] text-black/60">On this page</p>

            <ul className="mt-3 flex flex-col">
                {toc.map((h) => {
                    const active = activeId === h.id;

                    return (
                        <li key={h.id}>
                            <a
                                href={`#${h.id}`}
                                onClick={(e) => onJump?.(e, h.id)}
                                aria-current={active ? "location" : undefined}
                                /* ⚠️ The rule is a 1px TRACK and the position is
                                   a mark ON it. A thick coloured left border is
                                   the stock callout device — it reads as a
                                   status stripe rather than as "you are here",
                                   and at 2px it fights the 2px frames that carry
                                   real structure on this page. */
                                className={`help-focus relative block border-l border-black/15 py-2 pl-4 text-[13px] leading-[1.45] transition-colors duration-150 ${
                                    h.level === 3 ? "pl-7" : ""
                                } ${active ? "font-semibold text-black" : "text-black/60 hover:text-black"}`}
                            >
                                {active && (
                                    <span
                                        className="absolute -left-[3px] top-[calc(50%-3px)] h-[6px] w-[6px] bg-[#D1006A]"
                                        aria-hidden="true"
                                    />
                                )}
                                {h.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

/**
 * Phone: a sticky bar naming the section you are in, which opens the list.
 *
 * ⚠️ It renders NOTHING under three headings. A "contents" control above an
 * answer with two sections costs a row of screen and saves no scrolling.
 */
export function ArticleTocBar({ toc = [], activeId, progress = 0, onJump }) {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") setOpen(false);
        };
        const onDown = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDown);

        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDown);
        };
    }, [open]);

    if (toc.length < 3) return null;

    const current = toc.find((h) => h.id === activeId);

    return (
        <div ref={panelRef} className="help-sticky-top sticky z-20 -mx-4 mb-4 px-4 lg:hidden">
            <div className="overflow-hidden rounded-box-sm border-black bg-white">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className="help-focus flex min-h-[48px] w-full items-center gap-2.5 px-3 text-left"
                >
                    <List className="h-4 w-4 shrink-0 text-black" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                        <span className="block font-gulfs text-[10px] uppercase tracking-[0.16em] text-black/55">
                            On this page
                        </span>
                        <span className="block truncate text-[13px] font-semibold leading-[1.3] text-black">
                            {current?.text ?? toc[0].text}
                        </span>
                    </span>
                    <ChevronDown
                        className={`h-4 w-4 shrink-0 text-black transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        aria-hidden="true"
                    />
                </button>

                {/* How much is left. A count of headings does not answer that;
                    a filled line does, at a glance, with no number to read. */}
                <div className="h-[3px] w-full bg-black/10" aria-hidden="true">
                    <div
                        className="h-full bg-[#D1006A] transition-[width] duration-150"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {open && (
                    <ul className="max-h-[45dvh] overflow-y-auto border-t border-black/10">
                        {toc.map((h) => {
                            const active = activeId === h.id;

                            return (
                                <li key={h.id} className="border-b border-black/[0.07] last:border-b-0">
                                    <a
                                        href={`#${h.id}`}
                                        onClick={(e) => {
                                            onJump?.(e, h.id);
                                            setOpen(false);
                                        }}
                                        aria-current={active ? "location" : undefined}
                                        className={`help-focus flex min-h-[44px] items-center px-3 text-[14px] leading-[1.4] ${
                                            h.level === 3 ? "pl-7" : ""
                                        } ${active ? "bg-[#E6EA7B] font-semibold text-black" : "text-black/75"}`}
                                    >
                                        {h.text}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
