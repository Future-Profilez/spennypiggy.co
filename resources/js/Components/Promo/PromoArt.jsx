/**
 * The drawing on the right of each promo card.
 *
 * ⚠️ Hand-drawn, not an icon set, deliberately. A rounded-square icon in a tinted
 * circle is the single most recognisable "generated SaaS card" tell, and nine of
 * them side by side in one slider would read as nine of the same card. These are
 * flat 2px line drawings of the thing the card is actually about — a meter, a
 * stopwatch, a receipt — so each card is identifiable before its headline is read.
 *
 * ⚠️ Every stroke is `currentColor` and every width is 2. The card sets the colour
 * (black on the light grounds, white on the black one) and the house rule caps a
 * border at 2px, so the art matches the frame it sits inside rather than
 * competing with it. No fills except where a shape is a solid mark.
 */

const S = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

/** Founder bonus — a progress meter, three quarters filled. */
const Meter = () => (
    <>
        <rect x="6" y="46" width="84" height="18" rx="9" {...S} />
        <path d="M15 55h48" {...S} strokeWidth="10" strokeLinecap="round" />
        <path d="M12 34v-6M28 34V22M44 34V14M60 34v-8M76 34v-4" {...S} />
        <path d="M20 78h56" {...S} />
    </>
);

/** Fast Start — a stopwatch, hand near the top. */
const Stopwatch = () => (
    <>
        <circle cx="48" cy="52" r="26" {...S} />
        <path d="M48 52V34" {...S} />
        <path d="M48 52l13 9" {...S} />
        <path d="M40 18h16" {...S} />
        <path d="M48 18v8" {...S} />
        <path d="M70 30l6-6" {...S} />
    </>
);

/** Free until first sale — a receipt with a torn foot and a zero total. */
const Receipt = () => (
    <>
        <path
            d="M24 14h48v66l-8-6-8 6-8-6-8 6-8-6-8 6z"
            {...S}
        />
        <path d="M34 32h28M34 44h28M34 56h16" {...S} />
    </>
);

/** Verified badge — a rosette with a tick. */
const Badge = () => (
    <>
        <path
            d="M48 12l8 7 10-2 3 10 9 5-5 9 5 9-9 5-3 10-10-2-8 7-8-7-10 2-3-10-9-5 5-9-5-9 9-5 3-10 10 2z"
            {...S}
        />
        <path d="M37 48l8 8 15-16" {...S} />
    </>
);

/** Refer and earn — two links of a chain, joined. */
const Chain = () => (
    <>
        <rect x="10" y="36" width="42" height="24" rx="12" {...S} />
        <rect x="44" y="36" width="42" height="24" rx="12" {...S} />
        <path d="M38 48h20" {...S} />
    </>
);

/** Supporter wall — a podium, first place raised. */
const Podium = () => (
    <>
        <rect x="36" y="30" width="24" height="50" {...S} />
        <rect x="10" y="46" width="26" height="34" {...S} />
        <rect x="60" y="54" width="26" height="26" {...S} />
        <path d="M48 14l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" {...S} />
    </>
);

/** Link in bio — a browser address bar holding one link. */
const UrlBar = () => (
    <>
        <rect x="8" y="28" width="80" height="22" rx="11" {...S} />
        <path d="M20 39h30" {...S} />
        <circle cx="74" cy="39" r="5" {...S} />
        <path d="M32 50v10h32V50" {...S} />
        <path d="M32 60v8M64 60v8" {...S} />
        <path d="M22 72h20M54 72h20" {...S} />
    </>
);

/** Install the app — a phone with a home-screen tile on it. */
const Phone = () => (
    <>
        <rect x="26" y="10" width="44" height="76" rx="8" {...S} />
        <path d="M40 18h16" {...S} />
        <rect x="36" y="32" width="24" height="24" rx="7" {...S} />
        <path d="M48 38v12M42 44h12" {...S} />
        <path d="M38 68h20" {...S} />
    </>
);

/** Suggest a feature — a speech box with an unfinished line in it. */
const Speech = () => (
    <>
        <path d="M12 18h72v46H44L26 80V64H12z" {...S} />
        <path d="M26 34h44M26 46h28" {...S} />
    </>
);

const ART = {
    meter: Meter,
    stopwatch: Stopwatch,
    receipt: Receipt,
    badge: Badge,
    chain: Chain,
    podium: Podium,
    urlbar: UrlBar,
    phone: Phone,
    speech: Speech,
};

export default function PromoArt({ name, className = "", style }) {
    const Shape = ART[name] ?? Speech;

    return (
        <svg
            viewBox="0 0 96 96"
            className={className}
            style={style}
            aria-hidden="true"
            focusable="false"
        >
            <Shape />
        </svg>
    );
}
