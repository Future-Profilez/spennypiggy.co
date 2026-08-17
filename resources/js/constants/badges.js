/**
 * Profile badges — client mirror of `App\Support\Badges`.
 *
 * 🚨 THIS FILE AND THE PHP ONE MUST STAY IN STEP. A badge added here only is a
 * badge the picker offers and the server rejects; a badge added there only is
 * one nobody can pick. `tests/Unit/BadgesParityTest.php` asserts both sets and
 * both caps by parsing this file, so drift fails the suite rather than shipping.
 *
 * Two sets, deliberately apart: INTEREST_GROUPS is public profile data, PRIDE is
 * identity data stored in its own column and kept out of SEO/OG/share payloads
 * by construction. See the PHP docblock for why.
 */

export const MAX_INTERESTS = 6;
export const MAX_PRIDE = 3;

/**
 * ⚠️ Group order and item order ARE the render order — the picker adds none.
 *
 * 🚨 "Findom" and "Cashmaster" are deliberately absent (client decision,
 * 15 Aug 2026): both name money handed over for nothing, the exact framing every
 * payment surface here is written to avoid, on public text a Stripe reviewer
 * reads. Do not add them.
 */
export const INTEREST_GROUPS = [
    {
        group: "Performing",
        items: [
            { slug: "musician", label: "Musician", emoji: "🎵" },
            { slug: "dj", label: "DJ", emoji: "🎧" },
            { slug: "dancer", label: "Dancer", emoji: "💃" },
            { slug: "podcaster", label: "Podcaster", emoji: "🎙️" },
            { slug: "streamer", label: "Streamer", emoji: "📺" },
        ],
    },
    {
        group: "Making",
        items: [
            { slug: "artist", label: "Artist", emoji: "🎨" },
            { slug: "writer", label: "Writer", emoji: "✍️" },
            { slug: "video-creator", label: "Video Creator", emoji: "🎬" },
            { slug: "content-creator", label: "Content Creator", emoji: "🎞️" },
            { slug: "developer", label: "Developer", emoji: "💻" },
            { slug: "ai", label: "AI", emoji: "🤖" },
        ],
    },
    {
        group: "Style & body",
        items: [
            { slug: "beauty-creator", label: "Beauty Creator", emoji: "💄" },
            { slug: "fashionista", label: "Fashionista", emoji: "👗" },
            { slug: "model", label: "Model", emoji: "📸" },
            { slug: "cosplay-creator", label: "Cosplay Creator", emoji: "🎭" },
            { slug: "gym-girl", label: "Gym Girl", emoji: "🏋️‍♀️" },
            { slug: "gym-guy", label: "Gym Guy", emoji: "🏋️‍♂️" },
            { slug: "gym-fan", label: "Gym Fan", emoji: "🏋️" },
            // Retained from the original 17 — creators already wear it.
            { slug: "gym-bunny", label: "Gym Bunny", emoji: "🐰" },
            { slug: "lingerie-lover", label: "Lingerie Lover", emoji: "🎀" },
        ],
    },
    {
        group: "Community",
        items: [
            { slug: "gamer", label: "Gamer", emoji: "🎮" },
            { slug: "anime", label: "Anime", emoji: "🌸" },
            { slug: "whovian", label: "Whovian", emoji: "🛸" },
            { slug: "foodie", label: "Foodie", emoji: "🍜" },
            { slug: "influencer", label: "Influencer", emoji: "🌟" },
            { slug: "internet-princess", label: "Internet Princess", emoji: "👑" },
            { slug: "education-creator", label: "Education Creator", emoji: "📚" },
            { slug: "activist", label: "Activist", emoji: "✊" },
        ],
    },
    {
        group: "Grown-up",
        items: [
            { slug: "adult-creator", label: "Adult Creator", emoji: "🔥" },
            { slug: "dominant", label: "Dominant", emoji: "⛓️" },
            { slug: "good-sub", label: "Good Sub", emoji: "🖤" },
            { slug: "switch", label: "Switch", emoji: "🔄" },
            { slug: "vanilla", label: "Vanilla", emoji: "🍦" },
            { slug: "couple", label: "Couple", emoji: "💞" },
        ],
    },
];

/**
 * 🚨 SPECIAL-CATEGORY DATA — never put these in a title, a share caption, a meta
 * tag or anything sent to a payment provider.
 *
 * ⚠️ `colors` are the flag's stripes top-to-bottom and the picker draws them as
 * a gradient disc. Emoji cannot do this: only 🏳️‍🌈 and 🏳️‍⚧️ exist, so every
 * other badge would render as the same glyph against a different identity.
 */
export const PRIDE_BADGES = [
    {
        slug: "pride",
        label: "Pride",
        colors: ["#E40303", "#FF8C00", "#FFED00", "#008026", "#004DFF", "#750787"],
    },
    {
        slug: "pride-poc",
        label: "Pride POC",
        colors: ["#000000", "#613915", "#E40303", "#FF8C00", "#FFED00", "#008026", "#004DFF", "#750787"],
    },
    {
        slug: "pride-progress",
        label: "Pride Progress",
        colors: ["#FFFFFF", "#FFAFC8", "#74D7EE", "#613915", "#000000", "#E40303", "#FF8C00", "#FFED00", "#008026", "#004DFF", "#750787"],
    },
    {
        slug: "lesbian",
        label: "Lesbian",
        colors: ["#D52D00", "#EF7627", "#FF9A56", "#FFFFFF", "#D162A4", "#B55690", "#A30262"],
    },
    {
        slug: "gay",
        label: "Gay",
        colors: ["#078D70", "#26CEAA", "#98E8C1", "#FFFFFF", "#7BADE2", "#5049CC", "#3D1A78"],
    },
    {
        slug: "bisexual",
        label: "Bisexual",
        colors: ["#D60270", "#D60270", "#9B4F96", "#0038A8", "#0038A8"],
    },
    {
        slug: "trans",
        label: "Trans",
        colors: ["#5BCEFA", "#F5A9B8", "#FFFFFF", "#F5A9B8", "#5BCEFA"],
    },
    {
        slug: "genderqueer",
        label: "Genderqueer",
        colors: ["#B57EDC", "#FFFFFF", "#4A8123"],
    },
    {
        slug: "intersex",
        label: "Intersex",
        colors: ["#FFD800", "#7902AA", "#FFD800"],
    },
    {
        slug: "asexual",
        label: "Asexual",
        colors: ["#000000", "#A3A3A3", "#FFFFFF", "#800080"],
    },
    {
        slug: "pansexual",
        label: "Pansexual",
        colors: ["#FF218C", "#FFD800", "#21B1FF"],
    },
    {
        slug: "non-binary",
        label: "Non-Binary",
        colors: ["#FCF434", "#FFFFFF", "#9C59D1", "#2C2C2C"],
    },
    {
        slug: "genderfluid",
        label: "Genderfluid",
        colors: ["#FF75A2", "#FFFFFF", "#BE18D6", "#000000", "#333EBD"],
    },
    {
        slug: "aromantic",
        label: "Aromantic",
        colors: ["#3DA542", "#A7D379", "#FFFFFF", "#A9A9A9", "#000000"],
    },
];

export const INTEREST_BADGES = INTEREST_GROUPS.flatMap((g) => g.items);

const BY_SLUG = new Map(
    [...INTEREST_BADGES, ...PRIDE_BADGES].map((b) => [b.slug, b]),
);

/**
 * Normalise a stored value to a slug.
 *
 * ⚠️ This is what carries the ORIGINAL 17 categories forward — they were stored
 * as labels ("Video Creator") and each slugifies onto its new slug. Mirror of
 * `Badges::slugify()`; the two must agree or the client and the server disagree
 * about what a creator already picked.
 */
export const slugifyBadge = (value) =>
    String(value ?? "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export const badgeFor = (slug) => BY_SLUG.get(slugifyBadge(slug)) ?? null;

/**
 * Accepts the column in either shape (a JSON string or a real array — both are
 * in the table) and returns known slugs only, deduped and capped.
 */
export const readBadges = (stored, { pride = false } = {}) => {
    let values = stored;

    if (typeof values === "string") {
        try {
            values = JSON.parse(values);
        } catch {
            values = [];
        }
    }

    if (!Array.isArray(values)) return [];

    const allowed = new Set(
        (pride ? PRIDE_BADGES : INTEREST_BADGES).map((b) => b.slug),
    );
    const max = pride ? MAX_PRIDE : MAX_INTERESTS;
    const out = [];

    for (const value of values) {
        const slug = slugifyBadge(value);
        if (!slug || !allowed.has(slug) || out.includes(slug)) continue;
        out.push(slug);
        if (out.length >= max) break;
    }

    return out;
};

/** Labels in DEFINITION order, so two creators wearing the same set match. */
export const badgeLabels = (stored, { pride = false } = {}) => {
    const picked = new Set(readBadges(stored, { pride }));

    return (pride ? PRIDE_BADGES : INTEREST_BADGES)
        .filter((b) => picked.has(b.slug))
        .map((b) => b.label);
};

/**
 * The gradient a pride disc is painted with.
 *
 * 🚨 Built as an inline style, never a class. Tailwind's JIT only sees literal
 * class strings, so a template-built `bg-[linear-gradient(...)]` emits NO CSS at
 * all and the disc renders transparent — the documented silent-absence trap.
 */
export const prideGradient = (colors = []) => {
    if (!colors.length) return "#000";

    const step = 100 / colors.length;
    const stops = colors.map(
        (c, i) => `${c} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`,
    );

    return `linear-gradient(180deg, ${stops.join(", ")})`;
};
