import { Link } from "@inertiajs/react";
const transparentPixel = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InRyYW5zcGFyZW50Ii8+PC9zdmc+';
import TrustBox from './TrustBox';
import { useState, useEffect, useRef } from 'react';
import { RocketIcon, HouseIcon } from "@animateicons/react/lucide";
import FadeIn from '@/Components/animations/FadeIn';
import WordReveal from '@/Components/animations/WordReveal';
import Magnetic from '@/Components/animations/Magnetic';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

// Background wishlist tiles — styled like the brand's own product art
// (coloured card, chunky black skeleton bars, pink pill button). They live
// in two dim bands BEHIND the headline and drift right→left as you scroll.
const TILES = [
  { emoji: "💍", label: "Wedding",  price: "£899", bg: "#05EFB8", dark: true,  rot: "-rotate-3", lift: "mt-0" },
  { emoji: "🎮", label: "Gaming",   price: "£479", bg: "#8C52FF", dark: false, rot: "rotate-2",  lift: "mt-4" },
  { emoji: "👟", label: "Sneakers", price: "£179", bg: "#E6EA7B", dark: true,  rot: "-rotate-2", lift: "mt-1" },
  { emoji: "💄", label: "Makeup",   price: "£49",  bg: "#FF007F", dark: false, rot: "rotate-3",  lift: "mt-5" },
  { emoji: "📱", label: "Tech",     price: "£999", bg: "#05EFB8", dark: true,  rot: "-rotate-3", lift: "mt-2" },
  { emoji: "✈️", label: "Travel",   price: "£650", bg: "#E6EA7B", dark: true,  rot: "rotate-2",  lift: "mt-4" },
  { emoji: "🎂", label: "Birthday", price: "£120", bg: "#8C52FF", dark: false, rot: "-rotate-2", lift: "mt-1" },
];

// One brand-style wishlist item card — white showcase box for the product,
// price chip, heart badge and the pink gift button
function WishTile({ tile }) {
  return (
    <div className={`w-44 rounded-[18px] border-2 border-black shadow-black overflow-visible ${tile.rot} ${tile.lift}`} style={{ background: tile.bg }}>
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className={`font-gulfs uppercase tracking-wider text-[12px] leading-none ${tile.dark ? 'text-black' : 'text-white'}`}>
          {tile.label}
        </span>
        <span className="font-black text-[10px] leading-none bg-white border-2 border-black rounded-full px-2 py-[3px] text-black">
          {tile.price}
        </span>
      </div>
      <div className="relative mx-3 mt-2.5 rounded-[12px] bg-white border-2 border-black h-16 flex items-center justify-center">
        <span className="text-[34px] leading-none">{tile.emoji}</span>
        <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-[#FF007F] border-2 border-black rounded-full flex items-center justify-center text-[10px] leading-none">
          ❤️
        </span>
      </div>
      <div className="mx-3 my-3 rounded-full bg-black text-white text-center font-gulfs uppercase text-[9px] tracking-widest py-[6px]">
        Gift This 🎁
      </div>
    </div>
  );
}

// Scroll-driven INFINITE loop band: the row is rendered twice and the X
// position wraps around its own width, so however far you scroll the tiles
// keep cycling right→left and never run out. Enters the screen from the right.
function LoopBand({ tiles, speed = 0.4, delay = 0, className = "" }) {
  const { scrollY } = useScroll();
  const copyRef = useRef(null);
  const [copyWidth, setCopyWidth] = useState(0);

  useEffect(() => {
    const measure = () => copyRef.current && setCopyWidth(copyRef.current.offsetWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // wrap raw scroll distance into (-copyWidth, 0] for a seamless loop
  const x = useTransform(scrollY, (v) => {
    if (!copyWidth) return 0;
    const raw = -v * speed;
    return -((((-raw) % copyWidth) + copyWidth) % copyWidth);
  });

  const row = (ref) => (
    <div ref={ref} className="flex gap-8 md:gap-12 items-start pr-8 md:pr-12">
      {tiles.map((tile, i) => (
        <div key={i} style={{ animation: `float ${5.5 + (i % 3)}s ease-in-out ${i * 0.7}s infinite` }}>
          <WishTile tile={tile} />
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 240 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div style={{ x, willChange: "transform" }} className="flex w-max">
        {row(copyRef)}
        <div aria-hidden>{row(null)}</div>
      </motion.div>
    </motion.div>
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
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const blobsY = useTransform(scrollYProgress, [0, 1], [0, 120]);

  // ---- Mouse-driven depth: normalised cursor position -0.5..0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smx = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smy = useSpring(mouseY, { stiffness: 60, damping: 20 });

  // headline tilts gently toward the cursor
  const headRotateX = useTransform(smy, [-0.5, 0.5], [5, -5]);
  const headRotateY = useTransform(smx, [-0.5, 0.5], [-5, 5]);
  // background blobs drift with the cursor (far layer)
  const blobX = useTransform(smx, [-0.5, 0.5], [-35, 35]);
  const blobY = useTransform(smy, [-0.5, 0.5], [-25, 25]);
  // stickers drift against the cursor (near layer)
  const stickerX = useTransform(smx, [-0.5, 0.5], [40, -40]);
  const stickerY = useTransform(smy, [-0.5, 0.5], [30, -30]);

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

  const sections = ['home', 'features', 'faq'];
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
     const handleScroll = () => {
       const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
       const offset = 150;

       const currentSection = sections.find(section => {
         const sectionElement = document.getElementById(section);
         if (sectionElement) {
           const { offsetTop, offsetHeight } = sectionElement;
           return scrollTop >= offsetTop - offset && scrollTop < offsetTop + offsetHeight - offset;
         }
         return false;
       });
       setActiveSection(currentSection || '');
     };

     window.addEventListener('scroll', handleScroll);
     return () => {
       window.removeEventListener('scroll', handleScroll);
     };
   }, []);

  const handleNavItemClick = (e, section) => {
    e.preventDefault();
    const targetElement = document.getElementById(section);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [showPopup, setShowPopup] = useState(false);
  useEffect(() => {
      try {
          const lastShown = localStorage.getItem("popupLastShown");
          if (!lastShown || Date.now() - parseInt(lastShown) > 1000 * 60 * 60 * 24 * 7) {
              setShowPopup(true);
              localStorage.setItem("popupLastShown", Date.now());
          }
      } catch (e) {
          // localStorage unavailable (e.g. Safari private mode) — skip the popup
      }
  }, []);

  return <>
        <div className="block lg:hidden landing-bottom-bar bg-gray-900 border-t border-gray-800">
            <ul className="px-2 flex justify-between items-center w-full text-sm sm:text-normal mx-auto">
              <li>
                <a  href="#home"  className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'home' ? 'active text-[#FF007F]' : 'text-white'}`}
                    onClick={(e) => handleNavItemClick(e, 'home')}
                    onMouseEnter={() => houseIconRef.current?.startAnimation()}
                >
                  <HouseIcon ref={houseIconRef} size={24} color="currentColor" duration={1.5} />
                </a>
              </li>
              <li>
                <a href="#features" className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'features' ? 'active text-[#FF007F]' : 'text-white'}`} onClick={(e) => handleNavItemClick(e, 'features')}>
                  Features
                </a>
              </li>
              <li>
                <a href="#reviews" className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'reviews' ? 'active text-[#FF007F]' : 'text-white'}`} onClick={(e) => handleNavItemClick(e, 'reviews')}>
                  Reviews
                </a>
              </li>
              <li>
                <a href="#faq" className={`px-[7px] py-[5px] md:px-3 md:py-2 ${activeSection === 'faq' ? 'active text-[#FF007F]' : 'text-white'}`} onClick={(e) => handleNavItemClick(e, 'faq')}>
                  FAQ's
                </a>
              </li>
            </ul>
        </div>

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
          className="bg-transparent relative min-h-[80vh] lg:min-h-[85vh] flex items-center justify-center py-2 md:py-24 overflow-hidden"
        >

          <motion.div style={{ y: reduceMotion ? 0 : blobsY }} className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
              <motion.div style={reduceMotion ? {} : { x: blobX, y: blobY }} className="absolute inset-0">
                {/* one clean pink glow behind the headline + a faint violet floor light */}
                <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-[340px] md:w-[720px] h-[380px] bg-[#FF007F] rounded-full filter blur-[140px] opacity-30"></div>
                <div className="absolute -bottom-20 left-[5%] w-80 h-80 bg-[#8C52FF] rounded-full filter blur-[130px] opacity-20"></div>
              </motion.div>
          </motion.div>

          {/* Sparkles */}
          <div aria-hidden className="absolute inset-0 z-0 pointer-events-none select-none">
            <span className="absolute top-[18%] left-[22%] text-white/40 text-lg animate-pulse">✦</span>
            <span className="absolute top-[12%] right-[28%] text-[#E6EA7B]/50 text-sm animate-pulse" style={{ animationDelay: '0.8s' }}>✦</span>
            <span className="absolute bottom-[30%] left-[15%] text-[#FF007F]/50 text-sm animate-pulse" style={{ animationDelay: '1.4s' }}>✦</span>
            <span className="absolute bottom-[24%] right-[20%] text-white/30 text-lg animate-pulse" style={{ animationDelay: '2s' }}>✦</span>
          </div>

          {/* 3D perspective grid floor — drifts toward the viewer */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 right-0 h-[42%] z-0 pointer-events-none overflow-hidden"
            style={{
              maskImage: "linear-gradient(to top, black 25%, transparent 92%)",
              WebkitMaskImage: "linear-gradient(to top, black 25%, transparent 92%)",
            }}
          >
            <motion.div
              className="absolute -inset-x-[30%] -top-full -bottom-[60%]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,0,127,0.40) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,127,0.40) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                transform: "perspective(500px) rotateX(62deg)",
                transformOrigin: "center bottom",
              }}
              animate={reduceMotion ? {} : { backgroundPositionY: ["0px", "48px"] }}
              transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
            />
          </div>

          {/* 3D orbit ring around the headline — glowing dots travel the ellipse */}
          <div
            aria-hidden
            className="absolute left-1/2 top-[38%] z-0 pointer-events-none"
            style={{ transform: "translate(-50%,-50%)", perspective: "900px" }}
          >
            <div style={{ transform: "rotateX(72deg)", transformStyle: "preserve-3d" }}>
              <motion.div
                className="w-[340px] h-[340px] md:w-[780px] md:h-[780px] rounded-full border-2 border-dashed border-white/10 relative"
                animate={reduceMotion ? {} : { rotate: 360 }}
                transition={{ duration: 26, ease: "linear", repeat: Infinity }}
              >
                <div className="absolute -top-[7px] left-1/2 w-3 h-3 rounded-full bg-[#FF007F] shadow-[0_0_18px_5px_rgba(255,0,127,0.8)]"></div>
                <div className="absolute -bottom-[6px] left-1/2 w-2.5 h-2.5 rounded-full bg-[#05EFB8] shadow-[0_0_14px_4px_rgba(5,239,184,0.7)]"></div>
              </motion.div>
            </div>
          </div>

          {/* Background tile bands — pinned to the very top & bottom edges so they
              never overlap the headline; loop right→left endlessly with scroll */}
          {!reduceMotion && (
            <motion.div
              style={{ x: stickerX, y: stickerY }}
              className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-10 md:opacity-15"
            >
              <LoopBand tiles={TILES} speed={0.4} delay={0.4} className="absolute bottom-8 left-0 w-full" />
            </motion.div>
          )}

          {/* Dark vignette between the tile bands and the headline for readability */}
          <div
            aria-hidden
            className="absolute inset-0 z-1 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 62% 52% at 50% 42%, rgba(0,0,0,0.78), transparent 72%)" }}
          ></div>

          <motion.div
            style={reduceMotion ? {} : { y: contentY, scale: contentScale, opacity: contentOpacity }}
            className="containerbox relative z-2 w-full"
          >
            <div className="welcome px-4" >
                <div className="welcomeLeft mx-auto w-full text-center">
                    <motion.div
                      style={reduceMotion ? {} : { rotateX: headRotateX, rotateY: headRotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}
                    >
                        <h2 className="fading shadow-none uppercase text-white font-gulfs tracking-wide text-4xl sm:text-6xl md:text-7xl xl:text-[86px] max-w-6xl mx-auto text-center leading-[0.85] md:leading-[0.8]">
                          <WordReveal text="The everything" stagger={0.09} />
                          <div className='block mt-2 md:mt-2 text-4xl md:text-7xl xl:text-[80px]'>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.4, rotate: -6 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.35 }}
                                className="inline-block text-gradient-wishlists text-pink drop-shadow-[0_0_50px_rgba(249,79,150,0.5)] animate-pulse"
                            >
                                wishlist
                            </motion.span>
                          </div>
                        </h2>
                    </motion.div>

                    <FadeIn delay={0.15} y={20}>
                        <div className="flex items-center justify-center mt-4 md:mt-12 mb-6 md:mb-8">
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="h-[1px] w-24 origin-right bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"
                          ></motion.div>
                          <h3 className="text-center text-[18px] md:text-2xl  lg:text-3xl uppercase text-yellow-400 font-gulfs tracking-[0.2em] px-4">
                              Built for Creators
                          </h3>
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="h-[1px] w-24 origin-left bg-gradient-to-l from-transparent via-yellow-400/50 to-transparent"
                          ></motion.div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.3} y={20}>
                        <h3 className="text-center text-base md:text-2xl text-gray-300 font-poppins font-normal mb-10 md:mb-16 max-w-3xl mx-auto leading-relaxed opacity-100 px-2">
                          Get paid with secure, trackable income — with built-in
                          <span className="text-white font-semibold"> protection against disputes and chargebacks.</span>
                        </h3>
                    </FadeIn>
                    <FadeIn delay={0.45} y={15}>
                    <div className="pt-4 wishlistbtn wishlistbtnFixed mx-auto relative inline-block">

                      <Magnetic strength={0.3}>
                      {auth?.user?.username
                        ?
                        <Link
                          href={`/${auth && auth?.user && auth?.user?.username || ''}`}
                          className="relative inline-flex items-center gap-3 md:gap-4 bg-[#FF007F] text-white font-black text-base md:text-xl py-3 px-7 md:px-8 rounded-full shadow-[0_20px_50px_rgba(255,0,127,0.45)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden"
                          onMouseEnter={() => rocketIconRef1.current?.startAnimation()}
                        >
                          <span className="relative z-10">My Wishlist</span>
                          <RocketIcon ref={rocketIconRef1} size={24} duration={1.5} className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        :  <Link
                          href="/register"
                          className="relative inline-flex items-center gap-3 md:gap-4 bg-[#FF007F] text-white font-black text-base md:text-xl py-3 px-7 md:px-8 rounded-full shadow-[0_20px_50px_rgba(255,0,127,0.45)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden"
                          onMouseEnter={() => rocketIconRef2.current?.startAnimation()}
                        >
                            <span className="relative z-10">Create your page</span>
                            <RocketIcon ref={rocketIconRef2} size={24} duration={1.5} className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </Link>
                      }
                      </Magnetic>
                      <span className="absolute -top-5 -right-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[12px] font-gulfs uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-white/10 animate-bounce
                      ">It's Free 🎉</span>

                    </div>
                    </FadeIn>
                    <FadeIn delay={0.55} y={10}>
                    <div className=" flex justify-center">
                      <TrustBox />
                  </div>
                    </FadeIn>

                      <div className="m-auto max-w-[660px] flex justify-center items-center">
                        <p className='uppercase px-6 text-center mt-4 text-gray-400 font-poppins text-[11px] xl:text-[13px] tracking-wider'>*3 days Free trial and then requires a monthly £8.99 + VAT payment to cover stripe fees and compliance costs. </p>
                      </div>


                </div>
            </div>
          </motion.div>

        </div>
    </>
}
