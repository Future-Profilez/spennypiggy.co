import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import useIsMobile from "@/Components/animations/useIsMobile";

/* ------------------------------------------------------------------ *
 * Cinematic scroll-telling primitives.
 * All framer-motion + CSS sticky — no GSAP, SSR-safe (hooks only,
 * measurements happen client-side after mount), reduced-motion aware.
 * ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1];

/**
 * Parallax — drifts children vertically against the scroll for depth.
 * `amount` = px of travel across the element's full pass through the viewport.
 */
export function Parallax({ children, amount = 80, className = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} style={{ y, willChange: "transform" }} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * Reveal — content rises and fades in as it enters the viewport. Plain
 * opacity + translate (no clip-path) so it can never get stuck partially
 * clipped — mirrors the proven FadeIn pattern used across the app.
 */
export function Reveal({ children, className = "", delay = 0, y = 40 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ActIntro — a full-bleed chapter beat. A big ghost number + title that scale
 * and fade as the viewer scrolls through it, signalling a new act.
 */
export function ActIntro({ no, title, accentWord, sub, accent = "#FF007F" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.28, 0.9, 1], [0.15, 1, 1, 0.4]);
  const ghostX = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={ref} className="relative min-h-[44dvh] md:min-h-[48dvh] flex items-center justify-center overflow-hidden px-6">
      <motion.span
        aria-hidden
        style={reduce ? {} : { x: ghostX }}
        className="pointer-events-none select-none absolute font-gulfs leading-none text-[34vw] md:text-[24vw] opacity-[0.06]"
      >
        {no}
      </motion.span>
      <motion.div
        style={reduce ? {} : { y, opacity }}
        className="relative text-center max-w-3xl"
      >
        <span className="block font-gulfs uppercase tracking-[0.3em] text-sm mb-4" style={{ color: accent }}>
          Chapter {no}
        </span>
        <h2 className="font-gulfs uppercase text-white text-3xl md:text-5xl lg:text-6xl leading-[0.9] tracking-tight">
          {title}
          {accentWord ? <> <span className="text-gradient-wishlist">{accentWord}</span></> : null}
        </h2>
        {sub ? (
          <p className="font-poppins text-gray-300 text-base md:text-xl mt-6 max-w-xl mx-auto leading-relaxed">
            {sub}
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}

/**
 * HorizontalPan — pins a section and pans its track sideways as the user
 * scrolls vertically. Distance is measured client-side (no SSR guess).
 * Mobile / reduced-motion: degrades to a native horizontal snap-scroll.
 */
export function HorizontalPan({ children, className = "" }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const [dist, setDist] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setDist(Math.max(0, trackRef.current.scrollWidth - window.innerWidth));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 400); // re-measure after fonts/images settle
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [children]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const xRaw = useTransform(scrollYProgress, [0, 1], [0, -dist]);
  const x = useSpring(xRaw, { stiffness: 90, damping: 22, mass: 0.4 });

  if (reduce || isMobile) {
    return (
      <div className={`flex gap-5 overflow-x-auto snap-x snap-mandatory px-5 pb-4 no-scrollbar ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      style={{ height: dist ? `calc(100dvh + ${dist}px)` : "100dvh" }}
      className="relative"
    >
      <div className="sticky top-0 h-dvh flex items-center overflow-hidden">
        <motion.div
          ref={trackRef}
          style={{ x, willChange: "transform" }}
          className={`flex items-center gap-6 md:gap-8 px-[6vw] ${className}`}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * ChapterNav — fixed right-edge progress rail tracking the named acts.
 * IntersectionObserver based (no scroll listener). Desktop only.
 */
export function ChapterNav({ chapters }) {
  /**
   * ⚠️ Starts NULL, not at `chapters[0]`. Roughly the first 2,900px of the page —
   * the hero, the pricing note, the explainer — belong to no chapter, and seeding
   * the rail with "Proof" made it assert a position the reader is not in. Nothing
   * lit is the honest state there.
   */
  const [active, setActive] = useState(null);
  const reduce = useReducedMotion();

  /**
   * 🚨 THE RAIL USED TO OBSERVE NOTHING, AND SAID SO TO NOBODY.
   *
   * Every chapter anchor lives inside the homepage's `lazy()` + `<Suspense>`
   * boundary, so at mount `document.getElementById` returns null for all of
   * them. The old effect resolved `els` to `[]`, observed nothing, and — because
   * its only dependency is a module-level `CHAPTERS` const that never changes —
   * never ran again. `active` therefore stayed on `chapters[0].id` forever.
   * Measured live at nine scroll positions from y500 to y16500: the rail
   * reported "Proof" at every one, on a 17,000px page, on every desktop screen.
   *
   * The fix is to keep looking. A MutationObserver re-attaches the
   * IntersectionObserver as anchors appear and disconnects itself once the whole
   * set is present, so the cost is bounded to the page's own hydration.
   */
  useEffect(() => {
    if (!chapters?.length) return;

    const observed = new Set();

    /**
     * ⚠️ Tracks a VISIBLE SET and derives the active chapter from it, rather than
     * setting `active` on each intersection. The old form only ever set and never
     * cleared, so scrolling above the first chapter or into a gap between two left
     * the rail lit on whichever stop it last saw — measured after the observer was
     * repaired: at y600, deep in the hero, it still read "Join". A set can be
     * emptied; a last-write-wins handler cannot.
     */
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        // Chapter order is document order, so the first visible one is the topmost.
        setActive(chapters.find((c) => visible.has(c.id))?.id ?? null);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    // Returns true once every chapter has been found and observed.
    const attach = () => {
      chapters.forEach((c) => {
        if (observed.has(c.id)) return;
        const el = document.getElementById(c.id);
        if (el) {
          io.observe(el);
          observed.add(c.id);
        }
      });
      return observed.size === chapters.length;
    };

    if (attach()) return () => io.disconnect();

    const mo = new MutationObserver(() => {
      if (attach()) mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, [chapters]);

  /**
   * ⚠️ A cold deep link (`/#act-setup`) landed on nothing for the same reason:
   * the browser resolves the fragment during load, while the target is still
   * inside an unresolved Suspense boundary. Re-apply the hash once its element
   * exists. Bounded to one attempt per hash and abandoned after 10s so a stale
   * or misspelled fragment cannot leave an observer running.
   */
  useEffect(() => {
    const id = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!id || !chapters?.some((c) => c.id === id)) return;
    if (document.getElementById(id)) return; // already there; browser handled it

    const mo = new MutationObserver(() => {
      const el = document.getElementById(id);
      if (!el) return;
      mo.disconnect();
      clearTimeout(timer);
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => mo.disconnect(), 10000);
    return () => {
      mo.disconnect();
      clearTimeout(timer);
    };
  }, [chapters, reduce]);

  if (!chapters?.length) return null;

  return (
    <nav className="hidden xl:flex fixed right-7 top-1/2 -translate-y-1/2 z-40 flex-col gap-4">
      {chapters.map((c) => {
        const on = active === c.id;
        return (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="group flex items-center justify-end gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF007F]"
            aria-label={c.label}
            aria-current={on ? "true" : undefined}
          >
            {/* `text-gray-400` was a banned cool gray; the ink ramp is white/N. */}
            <span
              className={`font-gulfs uppercase tracking-widest text-[10px] ${
                reduce ? "" : "transition-all duration-300"
              } ${
                on
                  ? "text-white opacity-100 translate-x-0"
                  : "text-white/70 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
              }`}
            >
              {c.label}
            </span>
            <span
              className={`block rounded-full ${
                reduce ? "" : "transition-all duration-300"
              } ${
                on ? "w-3 h-3 bg-[#FF007F] shadow-[0_0_12px_2px_rgba(255,0,127,0.7)]" : "w-2 h-2 bg-white/40 group-hover:bg-white/70"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
