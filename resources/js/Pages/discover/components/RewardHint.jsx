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
    const label = desc || TYPE_LABEL[type];
    if (!label) return null;

    return (
        <div
            className={`flex max-w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-[20px] border border-emerald-600/25 bg-emerald-50 px-2.5 py-1.5 ${className}`}
            title={label}
        >
            <Gift size={13} strokeWidth={2.5} className="shrink-0 text-emerald-600" />
            <span className="truncate text-[11px] font-bold leading-tight text-emerald-700">
                <span className="text-emerald-600/80">You get:</span> {label}
            </span>
        </div>
    );
}
