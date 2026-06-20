import { useRef, useState } from "react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
    useTransform,
    useReducedMotion,
} from "framer-motion";
import useIsMobile from "@/Components/animations/useIsMobile";
import WishlistPreview from "./WishlistPreview";

const FEATURES = [
    {
        variant: "wishlist",
        eyebrow: "The Wishlist",
        title: "Add anything you want",
        desc: "Drop a link to anything from any store. Fans unlock the items you actually want, delivered to your door.",
        accent: "#E6EA7B",
        bullets: ["Any online store", "No setup, no fees", "Delivered to you"],
    },
    {
        variant: "gifts",
        eyebrow: "From your fans",
        title: "Watch support roll in",
        desc: "A live feed of everything your supporters buy. Secure, trackable, and 100% yours to keep.",
        accent: "#FF007F",
        bullets: ["Live updates", "Keep 100%", "Chargeback protection"],
    },
    {
        variant: "shop",
        eyebrow: "Your storefront",
        title: "Sell your own stuff",
        desc: "Content, services, merch. Your rules, your prices, all from one page.",
        accent: "#05EFB8",
        bullets: ["Digital or physical", "Set your price", "Track every order"],
    },
];

function FeatureText({ f }) {
    return (
        <div className="text-left">
            <span className="font-gulfs uppercase tracking-[0.28em] text-sm" style={{ color: f.accent }}>
                {f.eyebrow}
            </span>
            <h3 className="font-gulfs uppercase text-white text-4xl md:text-5xl lg:text-6xl leading-[0.92] tracking-tight mt-3 mb-5">
                {f.title}
            </h3>
            <p className="font-poppins text-gray-300 text-base md:text-xl leading-relaxed max-w-md mb-7">
                {f.desc}
            </p>
            <ul className="space-y-3">
                {f.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-white font-poppins font-medium">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.accent }}></span>
                        {b}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Mockup({ f }) {
    return (
        <div className="relative flex items-center justify-center">
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[360px] h-[360px] md:w-[440px] md:h-[440px] rounded-full blur-[120px] opacity-25" style={{ background: f.accent }}></div>
            </div>
            <div className="relative z-10 scale-[1.05] md:scale-[1.18] drop-shadow-[0_36px_70px_rgba(0,0,0,0.55)]">
                <WishlistPreview variant={f.variant} />
            </div>
        </div>
    );
}

export default function FeatureShowcase() {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const isMobile = useIsMobile();
    const [active, setActive] = useState(0);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });
    useMotionValueEvent(scrollYProgress, "change", (v) => {
        const idx = Math.min(FEATURES.length - 1, Math.max(0, Math.floor(v * FEATURES.length)));
        setActive(idx);
    });
    // continuous, scroll-linked motion so the pin never feels "stuck"
    const barScaleX = useTransform(scrollYProgress, [0, 1], [0.02, 1]);
    const mockupY = useTransform(scrollYProgress, [0, 1], [44, -44]);

    // Mobile / reduced-motion: a pinned scrub reads as broken on a small screen,
    // so flow each feature normally instead.
    if (isMobile || reduce) {
        return (
            <section className="bg-transparent py-16 space-y-24">
                {FEATURES.map((f, i) => (
                    <div key={i} className="container px-4 mx-auto grid grid-cols-1 gap-12 items-center">
                        <Mockup f={f} />
                        <FeatureText f={f} />
                    </div>
                ))}
            </section>
        );
    }

    const transition = { duration: 0.42, ease: [0.22, 1, 0.36, 1] };

    return (
        <section ref={ref} style={{ height: `${FEATURES.length * 78}vh` }} className="relative bg-transparent">
            <div className="sticky top-0 h-screen flex items-center overflow-hidden">
                <div className="container relative px-4 mx-auto grid md:grid-cols-2 gap-10 lg:gap-16 items-center">

                    {/* progress rail */}
                    <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 z-20">
                        {FEATURES.map((f, i) => (
                            <span
                                key={i}
                                className="w-[5px] rounded-full transition-all duration-300"
                                style={{ height: i === active ? 30 : 10, background: i === active ? f.accent : "rgba(255,255,255,0.25)" }}
                            ></span>
                        ))}
                    </div>

                    {/* TEXT */}
                    <div className="relative min-h-[360px] flex items-center md:pl-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, y: 34 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -34 }}
                                transition={transition}
                                className="w-full"
                            >
                                <FeatureText f={FEATURES[active]} />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* MOCKUP */}
                    <motion.div style={{ y: mockupY }} className="relative min-h-[440px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={active}
                                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.94, rotate: 3 }}
                                transition={transition}
                            >
                                <Mockup f={FEATURES[active]} />
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                </div>

                {/* scroll-progress bar — always moves, so the pin reads as progress, not a jam */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[60%] max-w-3xl h-[3px] rounded-full bg-white/10 overflow-hidden">
                    <motion.div style={{ scaleX: barScaleX }} className="h-full w-full origin-left rounded-full bg-gradient-to-r from-[#E6EA7B] via-[#FF007F] to-[#05EFB8]"></motion.div>
                </div>
            </div>
        </section>
    );
}
