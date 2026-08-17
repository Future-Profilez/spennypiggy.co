import { useMemo } from "react";
import RewardBlock from "./RewardBlock";
import { REWARD_PERKS, ON_PLATFORM_PERKS, rewardKind } from "@/constants/rewards";
import { Eye } from "lucide-react";

/**
 * Live "this is what your supporter sees" panel, rendered beside the reward
 * editor. It uses the exact component the supporter gets, so a creator can
 * never be surprised by the real thing — which is the whole reason listings
 * felt improvised before.
 */
export default function RewardPreview({
    value,
    recurring = false,
    showPerks = recurring,
    postAccessLabel,
    className = "",
}) {
    const reward = useMemo(() => {
        const media =
            value.type === "file" && value.file?.uuid
                ? {
                      url: `https://ucarecdn.com/${value.file.uuid}/`,
                      kind: rewardKind(value.file.mime, value.file.name),
                      mime: value.file.mime,
                      name: value.file.name,
                      size: value.file.size,
                  }
                : null;

        return {
            title: value.title?.trim() || "Your reward title appears here",
            type: value.type,
            description: value.description?.trim() || null,
            media,
            text: value.type === "message" ? value.body?.trim() || null : null,
            link: value.type === "link" ? value.body?.trim() || null : null,
            perks: showPerks
                ? value.perks
                      .map((selected) => REWARD_PERKS.find((perk) => perk.value === selected))
                      .filter(Boolean)
                      .map((perk) => ({ ...perk, is_on_platform: ON_PLATFORM_PERKS.includes(perk.value) }))
                : [],
            post_access: recurring,
            post_access_label: postAccessLabel,
        };
    }, [postAccessLabel, recurring, showPerks, value]);

    return (
        <div className={className}>
            <p className="mb-3 inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-neutral-500">
                <Eye size={14} strokeWidth={2.5} /> Supporter sees
            </p>
            <RewardBlock reward={reward} compact />
        </div>
    );
}
