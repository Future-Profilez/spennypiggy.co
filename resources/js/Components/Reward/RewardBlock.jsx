import RewardMedia, { RewardLink } from "./RewardMedia";
import { rewardKind } from "@/constants/rewards";
import { Check, Clock, Gift, Lock } from "lucide-react";

const KIND_LABEL = {
    image: "Photo",
    video: "Video",
    audio: "Audio",
    pdf: "PDF",
    document: "Document",
    archive: "Download pack",
    file: "Download",
};

function typeLabel(reward) {
    if (reward.type === "message") return "Written content";
    if (reward.type === "link") return "Link";
    if (reward.media) return KIND_LABEL[reward.media.kind || rewardKind(reward.media.mime, reward.media.name)];
    return "Content";
}

/**
 * The one way a reward is shown to a supporter — on the checkout page before
 * they pay, and on the thank-you page after.
 *
 * `locked` covers the bank-payment case: SEPA and ACH settle a day or two
 * later, and content must never be handed over on money that has not cleared.
 * The supporter still sees exactly what they bought, just not the file itself.
 */
export default function RewardBlock({
    reward,
    locked = false,
    heading,
    poster = null,
    compact = false,
    className = "",
}) {
    if (!reward) return null;

    const label = heading || (locked ? "What you'll receive" : "What you get");

    return (
        <section
            className={`rounded-box border-[3px] border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}
        >
            <header className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-box-sm border-2 border-black bg-[#FF007F] text-white">
                    <Gift size={16} strokeWidth={2.5} />
                </span>
                <h3 className="text-[11px] font-black uppercase tracking-[0.14em]">{label}</h3>
            </header>

            <p className="text-left text-lg font-black leading-tight">{reward.title}</p>

            {reward.description && (
                <p className="mt-1 text-left text-sm font-medium text-neutral-500">{reward.description}</p>
            )}

            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-[#A2E4B8] px-3 py-1 text-[11px] font-black uppercase tracking-wide">
                {typeLabel(reward)}
            </p>

            {locked ? (
                <div className="mt-4 flex items-start gap-3 rounded-box-sm border-[3px] border-black bg-[#FFF6D6] p-4">
                    <Clock size={18} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                    <p className="text-left text-sm font-semibold">
                        Your content unlocks as soon as your bank confirms the payment — usually 1–2
                        days. We'll email you the moment it's ready.
                    </p>
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    {reward.media && <RewardMedia media={reward.media} poster={poster} compact={compact} />}

                    {reward.type === "message" && reward.text && (
                        <div className="whitespace-pre-wrap rounded-box-sm border-[3px] border-black bg-[#F7F7F7] p-4 text-left text-sm font-medium leading-relaxed">
                            {reward.text}
                        </div>
                    )}

                    {reward.type === "link" && <RewardLink url={reward.link} />}
                </div>
            )}

            {(reward.perks?.length > 0 || reward.post_access) && (
                <div className="pt-4">
                    <p className="mb-3 text-left text-[11px] font-black uppercase tracking-[0.14em]">
                        Every month, while you're subscribed
                    </p>
                    <ul className="space-y-2">
                        {reward.perks?.map((perk) => (
                            <li key={perk.value} className="flex items-center gap-2 text-left text-sm font-semibold">
                                <Check size={16} strokeWidth={3} className="shrink-0 text-[#FF007F]" />
                                {perk.label}
                            </li>
                        ))}
                        {reward.post_access && (
                            <li className="flex items-center gap-2 text-left text-sm font-semibold">
                                <Lock size={16} strokeWidth={2.5} className="shrink-0 text-[#FF007F]" />
                                {reward.post_access_label || "Members-only posts"}
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </section>
    );
}
