import { Link } from "@inertiajs/react";
const transparentPixel = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+';
import TrustBox from './TrustBox';
import { useState, useEffect, useRef } from 'react';
import { RocketIcon, HouseIcon } from "@animateicons/react/lucide";
import FadeIn from '@/Components/animations/FadeIn';
import WordReveal from '@/Components/animations/WordReveal';
import Magnetic from '@/Components/animations/Magnetic';
import { PRICE_FORMATTED, SUBSCRIPTION_COPY, FREE_UNTIL_FIRST_SALE } from "@/constants/creatorSubscription";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

// Foreground product cards — the real hero asset. Coloured card, white showcase
// box, price chip, heart badge, pink action pill. These USED to sit at 10%
// opacity behind the headline; the redesign promotes them to full strength on
// the right side of the split.
//
// ⚠️ These must show what the platform ACTUALLY sells. They previously showed
// store goods (Sneakers £179, Gaming £479, Travel £650) — the "anything from any
// store, delivered to your door" wishlist, which is not built. Prices stay inside
// the real per-feature limits (`Helpers::priceWithinLimits`): min £4.99
// everywhere, £500 wish, £100/mo membership, £10,000 paid task.
//
// 🚨 THE `dark` FLAG IS GONE (21 Aug 2026). Tiles 2 and 3 carried the SAME
// background (`#05EFB8`) and disagreed about its ink — one black, one white — and
// the white one measured **1.50:1**, in the hero's own product mock, the first
// thing this page shows a visitor. Every tile background here is a light brand
// fill, so the house rule gives the same answer for all of them: a filled brand
// block takes BLACK type, never white. A per-tile flag is a footgun that can only
// ever be set wrong, so the label is now unconditionally black.
const TILES = [
  { emoji: "📸", label: "Photo set",    price: "£25",    bg: "#E6EA7B", pos: "left-0 top-2 md:top-4",    rot: "-rotate-6", z: "z-20", delay: 0.45 },
  { emoji: "🎬", label: "Custom video", price: "£75",    bg: "#05EFB8", pos: "right-0 top-24 md:top-28", rot: "rotate-5",  z: "z-30", delay: 0.30 },
  { emoji: "💎", label: "Gold tier",    price: "£15/mo", bg: "#05EFB8", pos: "left-6 bottom-2 md:left-10", rot: "rotate-3", z: "z-10", delay: 0.60 },
];

// Live "just unlocked" social proof — cycles through real catalogue items so the
// hero demonstrates the product in motion instead of sitting static.
const UNLOCKS = [
  { name: "Mia R.",    item: "Photo set",        emoji: "📸" },
  { name: "Jordan T.", item: "Custom video",     emoji: "🎬" },
  { name: "Priya S.",  item: "Gold tier",        emoji: "💎" },
  { name: "Leah K.",   item: "Behind the scenes", emoji: "🎞️" },
];

// The four things a creator most needs to know before scrolling. The free-period
// promise is a CONFIG SWITCH (`creator_subscription.free_until_first_sale`), not a
// permanent fact — it drops out of the line rather than being retyped as a
// constant, so the page cannot advertise it the day the policy is switched off.
const TRUST_POINTS = [
  ...(FREE_UNTIL_FIRST_SALE ? [SUBSCRIPTION_COPY.promise] : []),
  "Strictly SFW",
  "Paid every Friday",
  "Every creator ID-verified",
];

function UnlockToast({ reduceMotion }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % UNLOCKS.length), 3200);
    return () => clearInterval(t);
  }, []);
  const u = UNLOCKS[i];
  return (
    <div className="absolute -top-5 left-1 md:-top-6 md:left-2 z-40 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="flex items-center gap-2.5 bg-white border-2 border-black rounded-box-sm pl-2 pr-3.5 py-2"
        >
          <span className="w-8 h-8 rounded-full bg-[#FF007F] border-2 border-black flex items-center justify-center text-base leading-none">{u.emoji}</span>
          <span className="leading-tight">
            <span className="block font-black text-black text-[12px]">{u.name} unlocked</span>
            <span className="block font-gulfs uppercase tracking-wider text-[#C4006A] text-[12px]">{u.item} · just now</span>
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// One brand-style product card.
//
// ⚠️ NO HOVER SCALE OR ROTATE (client rule, site-wide). This used to
// `whileHover={{ scale: 1.06, rotate: 0, y: -6 }}` — growing an element on hover
// is banned everywhere on this site. A coloured surface signals hover through
// brightness instead, which is the same affordance without the reflow.
function WishTile({ tile }) {
  return (
    <div
      className={`w-40 md:w-44 rounded-box-sm border-2 border-black overflow-visible transition-[filter] duration-300 hover:brightness-[1.06] motion-reduce:transition-none ${tile.rot}`}
      style={{ background: tile.bg }}
    >
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className="font-gulfs uppercase tracking-wider text-[12px] leading-none text-black">
          {tile.label}
        </span>
        <span className="font-black text-[12px] leading-none bg-white border-2 border-black rounded-full px-2 py-[3px] text-black">
          {tile.price}
        </span>
      </div>
      <div className="relative mx-3 mt-2.5 rounded-[12px] bg-white border-2 border-black h-16 flex items-center justify-center">
        <span className="text-[34px] leading-none">{tile.emoji}</span>
        <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#FF007F] border-2 border-black rounded-full flex items-center justify-center text-[12px] leading-none">
          ❤️
        </span>
      </div>
      <div className="mx-3 my-3 rounded-full bg-black text-white text-center font-gulfs uppercase text-[12px] tracking-widest py-[6px]">
        Unlock
      </div>
    </div>
  );
}

export default function Hero({auth}) {

  const houseIconRef = useRef(null);
  const rocketIconRef1 = useRef(null);
  const rocketIconRef2 = useRef(null);
  const heroRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // ---- Scroll-driven exit: hero content drifts up, shrinks & fades as you scroll past
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const blobsY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  // ---- Mouse-driven depth: normalised cursor position -0.5..0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smx = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smy = useSpring(mouseY, { stiffness: 60, damping: 20 });

  // headline tilts gently toward the cursor
  const headRotateX = useTransform(smy, [-0.5, 0.5], [4, -4]);
  const headRotateY = useTransform(smx, [-0.5, 0.5], [-4, 4]);
  // pink glow drifts with the cursor (far layer)
  const blobX = useTransform(smx, [-0.5, 0.5], [-35, 35]);
  const blobY = useTransform(smy, [-0.5, 0.5], [-25, 25]);
  // tile cluster drifts against the cursor (near layer) for parallax depth
  const tileX = useTransform(smx, [-0.5, 0.5], [28, -28]);
  const tileY = useTransform(smy, [-0.5, 0.5], [20, -20]);

  const onHeroPointerMove = (e) => {
    if (reduceMotion || e.pointerType !== "mouse" || !heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onHeroPointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
        houseIconRef.current?.startAnimation?.();
        rocketIconRef1.current?.startAnimation?.();
        rocketIconRef2.current?.startAnimation?.();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  /* The logged-out mobile bar's four stops, in page order. One list drives the
     tabs AND the scroll-spy, because they had drifted apart: the spy watched
     `features`, an id that exists nowhere in the app, so no tab but Home ever
     lit up, and `reviews` was never watched at all. */
  const NAV_STOPS = [
    { id: 'home', label: 'Home' },
    /* ⚠️ IN PAGE ORDER, and the page was re-ordered on 22 Aug 2026: the product
       range (`act-sell`) now comes before the bonus chapter (`act-earn`). A bar
       whose tabs run in a different order than the page does highlights them out
       of sequence as the reader scrolls, which reads as a broken highlight. */
    { id: 'act-sell', label: 'Features' },
    { id: 'act-earn', label: 'Bonuses' },
    { id: 'faq', label: "FAQ's" },
  ];
  const sections = NAV_STOPS.map((stop) => stop.id);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
     /* ⚠️ The stops do NOT tile the page — `LiveBarSection`, `PaymentSlider` and
        the showcase sit between them. The old spy asked "is the scroll position
        INSIDE a section", so every gap between chapters cleared the highlight and
        the bar went blank mid-scroll. It also read `offsetTop`, which is measured
        from the nearest positioned ancestor, not the document. Take the last stop
        the reader has passed instead, measured from the document. */
     const handleScroll = () => {
       const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
       const offset = 150;

       let current = sections[0];
       sections.forEach((section) => {
         const el = document.getElementById(section);
         if (!el) return;
         const top = el.getBoundingClientRect().top + window.scrollY;
         if (scrollTop >= top - offset) current = section;
       });
       setActiveSection(current);
     };

     handleScroll();
     window.addEventListener('scroll', handleScroll, { passive: true });
     return () => {
       window.removeEventListener('scroll', handleScroll);
     };
   }, []);

  /* ⚠️ NOT `scrollIntoView`. Every chapter below the fold is a lazy <Suspense>
     with a placeholder roughly — not exactly — the height of its content, so the
     chunks that resolve while the smooth scroll is still running move the target
     underneath it. Tapping Features landed part-way down the chapter, past its
     own headline. So: measure, scroll with the sticky header allowed for, then
     re-measure once the page has settled and correct only if it actually moved. */
  const HEADER_OFFSET = 88;

  const handleNavItemClick = (e, section) => {
    e.preventDefault();

    const scrollToTarget = () => {
      const target = document.getElementById(section);
      if (!target) return null;
      const top = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET,
      );
      window.scrollTo({ top, behavior: 'smooth' });
      return top;
    };

    const firstTop = scrollToTarget();
    if (firstTop === null) return;

    window.setTimeout(() => {
      const target = document.getElementById(section);
      if (!target) return;
      const settledTop = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET,
      );
      /* A small drift is the smooth scroll still finishing; a large one is a
         chapter that finished loading. Only the second is worth a correction. */
      if (Math.abs(settledTop - firstTop) > 24) {
        window.scrollTo({ top: settledTop, behavior: 'smooth' });
      }
    }, 500);
  };

  const ctaIsUser = !!auth?.user?.username;
  const ctaHref = ctaIsUser ? `/${auth?.user?.username || ''}` : "/register";
  const ctaLabel = ctaIsUser ? "My Wishlist" : "Create your page";
  const ctaRef = ctaIsUser ? rocketIconRef1 : rocketIconRef2;

  return <>
        {!auth?.user && (
            <div className="block lg:hidden landing-bottom-bar bg-gray-900 border-t border-gray-800">
                <ul className="px-3 flex justify-between items-center w-full text-sm sm:text-normal mx-auto">
                  {NAV_STOPS.map((stop) => (
                    <li key={stop.id}>
                      {/* ⚠️ Touch targets were `px-[7px] py-[5px]` — ~24px tall, well
                          under the 44px floor, on the ONLY navigation a logged-out
                          mobile visitor gets. `.landing-bottom-bar ul a` sets
                          `display:block` at a higher specificity than a utility
                          class, so the height has to come from padding, not flex. */}
                      <a
                        href={`#${stop.id}`}
                        aria-label={stop.id === 'home' ? 'Home' : undefined}
                        aria-current={activeSection === stop.id ? 'true' : undefined}
                        className={`px-2.5 py-3 md:px-3 ${stop.id === 'home' ? 'mt-2' : ''} ${
                          activeSection === stop.id
                            ? 'active text-[#FF007F] !bg-none '
                            : 'text-white'
                        }`}
                        onClick={(e) => handleNavItemClick(e, stop.id)}
                        onMouseEnter={
                          stop.id === 'home'
                            ? () => houseIconRef.current?.startAnimation()
                            : undefined
                        }
                      >
                        {stop.id === 'home' ? (
                          <HouseIcon ref={houseIconRef} size={24} color="currentColor" duration={1.5} />
                        ) : (
                          stop.label
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
            </div>
        )}

        <img
          src={transparentPixel}
          loading="eager" alt=""  width="1"  height="1"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        />

        <div
          id="home"
          ref={heroRef}
          onPointerMove={onHeroPointerMove}
          onPointerLeave={onHeroPointerLeave}
          className="bg-transparent relative min-h-[88dvh] lg:min-h-[92dvh] flex items-center py-10 md:py-20 overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(115% 85% at 82% -5%, rgba(255,0,127,0.14), transparent 52%), radial-gradient(95% 80% at -5% 105%, rgba(140,82,255,0.12), transparent 55%)",
            }}
          ></div>

          {/* Single signature pink glow + faint violet floor light */}
          <motion.div style={{ y: reduceMotion ? 0 : blobsY }} className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
              <motion.div style={reduceMotion ? {} : { x: blobX, y: blobY }} className="absolute inset-0">
              </motion.div>
          </motion.div>

          {/* Fine film grain for premium texture (fixed, never repaints on scroll) */}
          <div
            aria-hidden
            className="absolute inset-0 z-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          ></div>

          <motion.div
            style={reduceMotion ? {} : { y: contentY, opacity: contentOpacity }}
            className="containerbox relative z-10 w-full"
          >
            <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">

              {/* LEFT — copy + CTA */}
              <div className="text-center lg:text-left">
                <FadeIn delay={0.05} y={14}>
                  <span className="inline-block text-[13px] md:text-base uppercase text-yellow-400 font-gulfs tracking-[0.22em] mb-5 md:mb-7">
                    Built for Creators
                  </span>
                </FadeIn>

                <motion.div
                  style={reduceMotion ? {} : { rotateX: headRotateX, rotateY: headRotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}
                >
                  <h1 className="uppercase text-white font-gulfs tracking-tight text-5xl sm:text-6xl md:text-[64px] xl:text-7xl leading-[0.85] md:leading-[0.82]">
                    <WordReveal text="The everything" stagger={0.09} />
                    <div className="block mt-2 text-5xl md:text-[64px] xl:text-7xl">
                      <span className="relative inline-block pb-2">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 180, damping: 15, delay: 0.35 }}
                          /* ⚠️ `bg-clip-text` + `text-transparent` needs a
                             forced-colors fallback. Windows High Contrast discards
                             the background image and the text stays transparent, so
                             the word "wishlist" disappears out of the page's only
                             <h1>. Same exposure when printing. */
                          className="relative inline-block bg-gradient-to-br from-[#FF6BB8] via-[#FF007F] to-[#C71585] bg-clip-text text-transparent drop-shadow-[0_6px_34px_rgba(255,0,127,0.35)] forced-colors:bg-none forced-colors:text-[CanvasText] print:bg-none print:text-black"
                        >
                          wishlist
                        </motion.span>
                        <motion.span
                          aria-hidden
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute left-1 right-2 bottom-0 h-[3px] origin-left rounded-full bg-gradient-to-r from-[#FF007F] via-[#FF6BB8] to-transparent"
                        ></motion.span>
                      </span>
                    </div>
                  </h1>
                </motion.div>

                <FadeIn delay={0.3} y={20}>
                  <p className="text-base md:text-xl text-gray-300 font-poppins font-normal mt-6 md:mt-8 mb-9 md:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Get paid with secure, trackable income, plus built-in
                    <span className="text-white font-semibold"> protection against disputes and chargebacks.</span>
                  </p>
                </FadeIn>

                <FadeIn delay={0.45} y={15}>
                  <div className="flex flex-col items-center lg:items-start gap-5">
                    <div className="relative inline-block">
                      <Magnetic strength={0.3}>
                        {/* ⚠️ NO hover scale/rotate (client rule, site-wide). The
                            gradient wash below is this button's hover state; the
                            tap state is a brightness drop, never a shrink. */}
                        <Link
                          href={ctaHref}
                          className="relative inline-flex min-h-[52px] items-center gap-3 md:gap-4 bg-[#FF007F] text-black font-black text-base md:text-xl py-3 px-7 md:px-9 rounded-full transition-[filter,opacity] duration-300 active:brightness-95 uppercase tracking-wide group overflow-hidden"
                          onMouseEnter={() => ctaRef.current?.startAnimation()}
                        >
                          <span className="relative z-10">{ctaLabel}</span>
                          <RocketIcon ref={ctaRef} size={24} duration={1.5} className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#E6EA7B] via-[#FF007F] to-[#05EFB8] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                      </Magnetic>
                      <span className="absolute -top-4 -right-3 bg-white text-[#C4006A] text-[12px] font-gulfs uppercase tracking-[0.18em] px-3 py-1 rounded-full">It's Free</span>
                    </div>

                    {/* The promise, not a footnote. "No charge until your first
                        sale" is the single strongest thing this page can say to a
                        creator, and it spent its life set in 11px grey under the
                        fold as an asterisk. It now sits alongside the other three
                        facts a creator weighs before signing up. */}
                    <ul className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 max-w-[560px] font-gulfs uppercase tracking-[0.1em] text-[12px] xl:text-[14px] text-white">
                      {TRUST_POINTS.map((point) => (
                        <li key={point} className="flex items-center gap-2">
                          <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-[#05EFB8] flex-shrink-0"></span>
                          {point}
                        </li>
                      ))}
                    </ul>

                    <TrustBox />

                    {/* ⚠️ Was `text-gray-400` at 11px — under the AA contrast floor
                        AND under the 12px type floor, on the one line that states
                        the platform's pricing promise. */}
                    <p className="uppercase text-center lg:text-left max-w-[520px] text-white/60 font-poppins text-[12px] tracking-wider">
                      {FREE_UNTIL_FIRST_SALE
                        ? <>*{SUBSCRIPTION_COPY.reassurance} After your first sale, a monthly {PRICE_FORMATTED} + VAT payment covers Stripe fees and compliance costs.</>
                        : <>*A monthly {PRICE_FORMATTED} + VAT payment covers Stripe fees and compliance costs. No commission on your sales.</>}
                    </p>
                  </div>
                </FadeIn>
              </div>

              {/* RIGHT — live product cluster (the brand's own wishlist art) */}
              <motion.div
                style={reduceMotion ? {} : { x: tileX, y: tileY }}
                className="relative h-[340px] md:h-[440px] lg:h-[480px] w-full max-w-[400px] mx-auto"
              >
                <div aria-hidden className="absolute inset-0 -z-10 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle at 52% 46%, rgba(255,0,127,0.20), transparent 68%)" }}></div>
                <UnlockToast reduceMotion={reduceMotion} />
                {TILES.map((tile, i) => (
                  <motion.div
                    key={i}
                    initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 160, damping: 16, delay: tile.delay }}
                    className={`absolute ${tile.pos} ${tile.z}`}
                  >
                    <div style={reduceMotion ? {} : { animation: `float ${8 + i}s ease-in-out ${i * 0.8}s infinite` }}>
                      <WishTile tile={tile} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

            </div>
          </motion.div>

        </div>
    </>
}
