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
    <section ref={ref} className="relative min-h-[44vh] md:min-h-[48vh] flex items-center justify-center overflow-hidden px-6">
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
      style={{ height: dist ? `calc(100vh + ${dist}px)` : "100vh" }}
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
  const [active, setActive] = useState(chapters?.[0]?.id);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!chapters?.length) return;
    const els = chapters
      .map((c) => document.getElementById(c.id))
      .filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapters]);

  if (!chapters?.length) return null;

  return (
    <nav className="hidden xl:flex fixed right-7 top-1/2 -translate-y-1/2 z-40 flex-col gap-4">
      {chapters.map((c) => {
        const on = active === c.id;
        return (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="group flex items-center justify-end gap-3"
            aria-label={c.label}
          >
            <span
              className={`font-gulfs uppercase tracking-widest text-[10px] transition-all duration-300 ${
                on ? "text-white opacity-100 translate-x-0" : "text-gray-400 opacity-0 translate-x-2 group-hover:opacity-70 group-hover:translate-x-0"
              }`}
            >
              {c.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                on ? "w-3 h-3 bg-[#FF007F] shadow-[0_0_12px_2px_rgba(255,0,127,0.7)]" : "w-2 h-2 bg-white/30 group-hover:bg-white/60"
              } ${reduce ? "" : ""}`}
            />
          </a>
        );
      })}
    </nav>
  );
}
