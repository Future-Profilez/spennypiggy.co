import { Gift } from "lucide-react";
import { DEFAULT_REWARD_TITLE } from "@/constants/rewards";

const TYPE_LABEL = {
    file: "Download",
    message: "Written content",
    link: "Link",
};

/**
 * The one-line "what you get" a buyer sees BEFORE paying — on a product card,
 * in the add-to-cart popup, and on each basket row.
 *
 * It deliberately shows only the reward headline and its detail, never
 * `reward_body`: that is the paid content, and the buyer has not paid yet.
 * Without this, a basket showed a name and a price and nothing about what the
 * money actually buys.
 *
 * Takes the raw item columns, so any surface with the item can render it — no
 * extra endpoint or server payload shape required.
 */
export default function RewardSummary({
    title,
    type,
    description,
    label = "What you get",
    compact = false,
    className = "",
}) {
    const headline = (title || "").trim() || DEFAULT_REWARD_TITLE;
    const detail = (description || "").trim();

    if (compact) {
        return (
            <p className={`text-left text-xs font-semibold text-neutral-600 ${className}`}>
                <span className="font-black uppercase tracking-wide text-neutral-400">{label}: </span>
                {headline}
                {detail ? ` — ${detail}` : ""}
            </p>
        );
    }

    return (
        <div
            className={`rounded-box-sm border-[3px] border-black bg-[#F2FBF5] p-3 text-left ${className}`}
        >
            <p className="mb-1 flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.14em] text-neutral-500">
                <Gift size={12} strokeWidth={2.5} /> {label}
            </p>
            <p className="text-sm font-black leading-snug">{headline}</p>
            {detail && <p className="mt-0.5 text-xs font-medium text-neutral-500">{detail}</p>}
            {TYPE_LABEL[type] && (
                <span className="mt-2 inline-block rounded-full border-2 border-black bg-white px-2 py-0.5 text-[12px] font-black uppercase tracking-wide">
                    {TYPE_LABEL[type]}
                </span>
            )}
        </div>
    );
}
