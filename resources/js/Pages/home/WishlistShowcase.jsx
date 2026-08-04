import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import useIsMobile from "@/Components/animations/useIsMobile";

/**
 * Wishlist showcase — a cinematic 3D card stage.
 * Desktop: cards fan out in real 3D (perspective + translateZ), the centre card
 * pops forward, edge cards recede and angle inward with a depth-of-field blur.
 * The whole fan tilts toward the cursor, lit by a soft glow, each card floating
 * on its own phase. Mobile: an upright snap-scroll row (3D parallax needs a
 * pointer). Reduced motion: static fan, no float, no tilt.
 *
 * Copy uses content/support language to stay aligned with Stripe content rules.
 */

const PURPLE = "#8C52FF";
const PINK = "#FF007F";

// z = depth (px, + = toward viewer), ry = yaw toward centre, blur/dim = depth-of-field
const CARDS = [
    { z: -120, ry: 24, top: "42%", left: "5%", blur: 0.9, dim: 0.84, dur: "6.5s", delay: "0s",
      render: () => <ProductCard emoji="🎧" tag="Added by 1,200 creators" title="AirPods Max" price="£499.00" cta="Add to wishlist" accent={PURPLE} /> },
    { z: -55, ry: 16, top: "50%", left: "20%", blur: 0.4, dim: 0.93, dur: "7.5s", delay: "0.5s",
      render: () => <ProductCard emoji="🥤" tag="Trending this week" title="Stanley Tumbler" price="£49.99" cta="Add to wishlist" accent={PINK} /> },
    { z: 30, ry: 8, top: "55%", left: "35%", blur: 0, dim: 1, dur: "6s", delay: "1s",
      render: () => <ShareCard handle="spennypiggy.co/justjack" /> },
    { z: 95, ry: 0, top: "57%", left: "50%", blur: 0, dim: 1, dur: "5.5s", delay: "0.2s",
      render: () => <ThankYouCard /> },
    { z: 30, ry: -8, top: "55%", left: "65%", blur: 0, dim: 1, dur: "6.8s", delay: "0.8s",
      render: () => <SupportCard handle="@legitjustjack" amount="£1,000.00" /> },
    { z: -55, ry: -16, top: "50%", left: "80%", blur: 0.4, dim: 0.93, dur: "7.2s", delay: "1.3s",
      render: () => <ProductCard emoji="📱" tag="Most requested" title="iPhone 16 Pro" price="£1,200.00" cta="Add to wishlist" accent={PURPLE} /> },
    { z: -120, ry: -24, top: "42%", left: "95%", blur: 0.9, dim: 0.84, dur: "6.3s", delay: "0.4s",
      render: () => <ProductCard emoji="🍧" tag="Added by 3,000 creators" title="Ninja Slushie" price="£349.99" cta="Add to wishlist" accent={PINK} /> },
];

export default function WishlistShowcase() {
    const isMobile = useIsMobile();
    const reduce = useReducedMotion();

    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 90, damping: 18 });
    const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-15, 15]), { stiffness: 90, damping: 18 });

    // Mobile (and SSR fallback when the hook reports mobile): upright scroll row.
    if (isMobile) {
        return (
            <div className="wcards" role="list" aria-label="Example wishlist and supporter activity">
                {CARDS.map((c, i) => (
                    <div key={i} role="listitem" className="wcard">{c.render()}</div>
                ))}
            </div>
        );
    }

    const onMove = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
    };
    const onLeave = () => { mx.set(0); my.set(0); };

    return (
        <div className="wstage" onMouseMove={reduce ? undefined : onMove} onMouseLeave={reduce ? undefined : onLeave}>
            <div className="wstage-glow" aria-hidden />
            <motion.div
                className="wstage-inner"
                style={reduce ? {} : { rotateX, rotateY, transformPerspective: 1500 }}
                role="list"
                aria-label="Example wishlist and supporter activity"
            >
                {CARDS.map((c, i) => (
                    <div
                        key={i}
                        role="listitem"
                        className="w3d"
                        style={{ left: c.left, top: c.top, "--z": `${c.z}px`, "--ry": `${c.ry}deg`, "--blur": `${c.blur}px`, "--dim": c.dim }}
                    >
                        <div className="w3d-float" style={{ "--dur": c.dur, "--delay": c.delay }}>
                            {c.render()}
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

function Shell({ children, className = "", accent = PINK }) {
    return (
        <div
            className={`relative h-full rounded-[16px] border border-white/10 bg-[#14141f]/95 backdrop-blur-xl p-3.5 flex flex-col ${className}`}
            style={{ boxShadow: `0 16px 46px -12px rgba(0,0,0,0.8), inset 0 0 0 1px ${accent}22, 0 0 26px -8px ${accent}66` }}
        >
            <span className="pointer-events-none absolute inset-x-3 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.7 }}></span>
            {children}
        </div>
    );
}

// glossy highlight + uppercase CTA with a trailing glyph
function GlossButton({ children, glyph, accent }) {
    return (
        <button
            className="relative mt-auto w-full min-h-[44px] text-white text-[12px] font-black uppercase tracking-wide py-2.5 rounded-[10px] overflow-hidden flex items-center justify-center gap-1.5"
            style={{ background: accent, boxShadow: `0 6px 18px -4px ${accent}99` }}
        >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></span>
            <span className="relative">{children}</span>
            <span className="relative">{glyph}</span>
        </button>
    );
}

function ProductCard({ emoji, tag, title, price, cta, accent }) {
    return (
        <Shell accent={accent}>
            {/* wishlist heart */}
            <span
                className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] rotate-12 z-10 ring-2 ring-[#14141f]"
                style={{ background: accent, boxShadow: `0 0 16px -2px ${accent}` }}
                aria-hidden
            >♥</span>

            {/* dark product tile with accent glow */}
            <div className="relative w-full h-[70px] rounded-[12px] border border-white/10 bg-white/[0.04] overflow-hidden mb-2.5 flex items-center justify-center">
                <span className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 55%, ${accent}40, transparent 70%)` }}></span>
                <span className="relative text-[38px] select-none" aria-hidden>{emoji}</span>
                <span className="absolute top-1.5 right-2 text-[11px] opacity-70 select-none" aria-hidden>✨</span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wide text-white/45">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }}></span>{tag}
            </span>
            <h4 className="font-gulfs uppercase text-[14px] leading-tight text-white mt-1">{title}</h4>
            <p className="font-black text-[18px] mt-1 mb-2.5" style={{ color: accent }}>{price}</p>
            <GlossButton glyph="→" accent={accent}>{cta}</GlossButton>
        </Shell>
    );
}

function ShareCard({ handle }) {
    return (
        <Shell accent={PURPLE} className="!justify-center">
            <div className="flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-[8px] flex items-center justify-center text-xs" style={{ background: `${PURPLE}33` }} aria-hidden>🔗</span>
                <p className="font-gulfs uppercase text-[13px] text-white leading-tight">Share your page</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-[10px] px-2.5 py-1.5">
                <span className="text-[11px] font-bold text-white/70 truncate">{handle}</span>
                <span className="ml-auto text-[11px] font-black uppercase text-white rounded-[6px] px-2 py-1" style={{ background: PURPLE }}>Copy</span>
            </div>
        </Shell>
    );
}

function ThankYouCard() {
    return (
        <Shell accent={PURPLE}>
            <div className="flex items-start gap-2 mb-2.5">
                <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white text-[11px] font-black bg-gradient-to-br from-[#8C52FF] to-[#FF007F]">JJ</span>
                <p className="text-[11.5px] text-white/75 leading-snug bg-white/5 border border-white/10 rounded-[10px] rounded-tl-[3px] px-2.5 py-1.5">
                    <span className="font-black text-white">@legitjustjack</span> just supported your content! 🙌
                </p>
            </div>
            <GlossButton glyph="💜" accent={PURPLE}>Send thank you</GlossButton>
        </Shell>
    );
}

function SupportCard({ handle, amount }) {
    return (
        <Shell accent={PINK}>
            <span className="absolute top-2.5 right-3 text-xs opacity-80 select-none" aria-hidden>🎉</span>
            <span className="absolute top-7 right-7 text-[11px] opacity-60 select-none" aria-hidden>✨</span>
            <div className="flex items-center gap-2 mb-2">
                <span className="relative w-8 h-8">
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: `${PINK}40` }}></span>
                    <span className="relative w-8 h-8 rounded-full flex items-center justify-center text-sm ring-2 ring-[#14141f]" style={{ background: `${PINK}33` }} aria-hidden>💖</span>
                </span>
                <span className="text-[11px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: PINK }}>New supporter</span>
            </div>
            <p className="text-[11.5px] text-white/70 leading-snug">
                <span className="font-black text-white">{handle}</span> supported you
            </p>
            <p className="font-black text-[20px] mt-1" style={{ color: PINK }}>{amount}</p>
        </Shell>
    );
}
