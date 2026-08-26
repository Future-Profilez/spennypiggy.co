/**
 * Membership tier colours — ONE definition.
 *
 * 🚨 The tier's colour is its identity. It was declared inside
 * `Components/MembershipItem.jsx`, and the moment a second surface needed it
 * (Discover's board card) a copy would have drifted the first time a tier was
 * renamed or recoloured — leaving the same membership drawn in two colours on
 * two screens.
 *
 * ⚠️ Platinum reads as the top rung (near-black): as flat tints it and silver
 * were within a hair of each other and told the tiers apart badly.
 * ⚠️ Every pairing here is a measured one — bronze/platinum/lifetime carry white
 * type, the light tiers carry black. Do not swap a background without its ink.
 */
export const TIER_THEMES = {
    gold: { bg: "bg-[#FFD700]", hex: "#FFD700", text: "text-black", ink: "text-black/60" },
    silver: { bg: "bg-[#D8DCE3]", hex: "#D8DCE3", text: "text-black", ink: "text-black/60" },
    bronze: { bg: "bg-[#F97316]", hex: "#F97316", text: "text-white", ink: "text-white/75" },
    platinum: { bg: "bg-[#12131A]", hex: "#12131A", text: "text-white", ink: "text-white/60" },
    lifetime: { bg: "bg-[#22C55E]", hex: "#22C55E", text: "text-white", ink: "text-white/75" },
    default: { bg: "bg-[#A2E4B8]", hex: "#A2E4B8", text: "text-black", ink: "text-black/60" },
};

/** A tier name in any casing → its theme, falling back to the house mint. */
export function tierTheme(level) {
    return TIER_THEMES[String(level || "").trim().toLowerCase()] || TIER_THEMES.default;
}
