import { Gift } from 'lucide-react';

/**
 * RewardHint — the "what you get after you pay" teaser shown under an item card
 * on Discover. Discover-only by construction: it renders nothing unless the item
 * carries reward metadata (only the Discover payload includes it), and nothing
 * for non-sellable items like creators.
 *
 * Never shows reward_body (that is the paid content). Prefers the creator's own
 * reward description; falls back to a type label so every sellable item still
 * answers the question.
 */
const TYPE_LABEL = {
    file: 'Instant download',
    message: 'Exclusive content',
    link: 'Private link',
};

export default function RewardHint({ item, className = '' }) {
    if (!item) return null;
    const type = item.reward_type;
    const desc = (item.reward_description || '').trim();
    // A sellable item always carries a reward_title (backfilled for legacy
    // rows). When the creator gave no description and no explicit type, still
    // reassure the buyer they get something back rather than showing nothing.
    // A physical shop product's deliverable is the parcel, not digital content,
    // so it gets no generic "exclusive content" fallback.
    const isPhysical = item.type === 'physical';
    const hasReward = !isPhysical && ('reward_title' in item || 'reward_type' in item);
    const label = desc || TYPE_LABEL[type] || (hasReward ? 'Exclusive content' : null);
    if (!label) return null;

    return (
        <div
            className={`flex max-w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-box-sm border border-emerald-600/25 bg-emerald-50 px-2.5 py-1.5 ${className}`}
            title={label}
        >
            <Gift size={13} strokeWidth={2.5} className="shrink-0 text-emerald-600" />
            {/* ⚠️ The "You get:" prefix is HIDDEN on a narrow card, because there
                it consumes the width the ANSWER needs. Measured in a two-column
                wish grid at 390px: the pill has ~127px of text room and
                "You get: Exclusive content" wants ~150px, so it rendered as
                "You get: Exclusiv…" — the label truncating the only part that
                carries information. The gift icon already says "you get"; the
                words are the part worth keeping. */}
            <span className="truncate text-[10px] font-bold leading-tight text-emerald-700 sm:text-[12px]">
                <span className="hidden text-emerald-600/80 sm:inline">You get:</span>{" "}
                {label}
            </span>
        </div>
    );
}
