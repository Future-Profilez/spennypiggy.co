import { useReducedMotion } from "framer-motion";
import { Reveal } from "@/Components/cinematic/Cinematic";
import WishlistPreview from "./WishlistPreview";

const FEATURES = [
    {
        variant: "wishlist",
        // ⚠️ This sold the store-item wishlist ("any online store… delivered to
        // you"), which is not built. Everything named here is a live product.
        eyebrow: "The Wishlist",
        title: "Add anything you want",
        desc: "Build one page with everything you offer — exclusive content, custom requests, memberships, your own products. Supporters unlock what they want, you get paid for it.",
        accent: "#E6EA7B",
        bullets: ["Content, custom work or products", "Set your own prices", "No commission on your sales"],
    },
    {
        variant: "activity",
        eyebrow: "From your fans",
        title: "Watch support roll in",
        desc: "A live feed of everything your supporters buy. Secure, trackable, and 100% yours to keep — then say thank you without leaving the page.",
        accent: "#FF007F",
        bullets: ["Live updates", "Keep 100%", "Post a thank-you in one tap"],
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
                {/* ⚠️ `w-[360px]` on a 390px phone (≈358px of column after `px-4`)
                    overflowed its centring flex by a couple of pixels and put a
                    horizontal scrollbar on the page. The section has no
                    `overflow-hidden`, so the glow has to constrain itself. Identical
                    from `sm:` up. */}
                <div className="w-full max-w-[360px] h-[360px] md:max-w-[440px] md:h-[440px] rounded-full blur-[120px] opacity-25" style={{ background: f.accent }}></div>
            </div>
            {/* ⚠️ Was `md:w-autorelative` — two classes run together, so `md:w-auto`
                never applied AND `relative` was lost, which silently made the
                `z-10` beside it inert (z-index needs a positioned element). */}
            <div className="w-full md:w-auto relative z-10 md:scale-[1.18] drop-shadow-[0_36px_70px_rgba(0,0,0,0.55)]">
                <WishlistPreview variant={f.variant} />
            </div>
        </div>
    );
}

/**
 * 🚨 THIS SECTION IS NO LONGER PINNED, and must not be re-pinned.
 *
 * It used to scroll-jack `FEATURES.length * 78dvh` — measured live at **1,771px,
 * two full desktop viewports** — to reveal three features one at a time. In that
 * space it restated the product list that `WaysToGetPaid` presents in a single
 * screen, immediately above it, and better: the whole product range grouped by
 * when the money arrives. The page named its products four separate times, and
 * this was the most expensive of the four.
 *
 * What it still owns is the only thing `WaysToGetPaid` cannot show — the three
 * mock-ups, the sole picture of what a creator's page actually looks like. So
 * the machinery went and the pictures stayed: three flowed rows, alternating
 * sides on desktop, no pin, no scrub, no progress rail (the page already has a
 * ScrollProgressBar and a ChapterNav saying the same thing).
 *
 * The old code kept a separate mobile/reduced-motion branch that was exactly
 * this layout — it is now simply the only branch, so there is one thing to
 * maintain and every visitor sees the same section.
 */
export default function FeatureShowcase() {
    const reduce = useReducedMotion();

    return (
        <section className="bg-transparent py-10 md:py-20">
            <div className="container px-4 mx-auto space-y-16 md:space-y-28">
                {FEATURES.map((f, i) => {
                    const row = (
                        <>
                            <div className={i % 2 ? "md:order-2" : ""}>
                                <Mockup f={f} />
                            </div>
                            <div className={i % 2 ? "md:order-1" : ""}>
                                <FeatureText f={f} />
                            </div>
                        </>
                    );
                    const grid = (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                            {row}
                        </div>
                    );
                    // Reveal is already reduced-motion aware; skip the wrapper entirely
                    // under reduce so there is no motion component in the tree at all.
                    return (
                        <div key={f.variant}>
                            {reduce ? grid : <Reveal delay={0.05} y={28}>{grid}</Reveal>}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
