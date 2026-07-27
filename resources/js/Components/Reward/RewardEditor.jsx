import { useCallback, useEffect, useMemo, useRef } from "react";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import RewardMedia, { RewardLink } from "./RewardMedia";
import {
    REWARD_ACCEPT,
    REWARD_DESCRIPTION_MAX,
    REWARD_MESSAGE_MAX,
    REWARD_PERKS,
    REWARD_TITLE_MAX,
    REWARD_TYPES,
    ON_PLATFORM_PERKS,
    rewardKind,
} from "@/constants/rewards";
import { Check, Lock, Sparkles, Trash2 } from "lucide-react";

/** A blank reward, ready to be dropped into a form's initial state. */
export function emptyReward(overrides = {}) {
    return {
        title: "",
        type: "file",
        body: "",
        description: "",
        file: null,
        perks: [],
        ...overrides,
    };
}

/**
 * Rebuild the editor's value from a saved item, so editing shows what the
 * supporter currently gets rather than an empty form. `fileColumns` names the
 * module's own file columns, which differ per table (wish uses content_file,
 * shop uses reward_file, task uses deliverable_content …).
 */
export function rewardFromItem(item, fileColumns = {}) {
    if (!item) return emptyReward();

    const {
        file = "content_file",
        mime = "content_file_type",
        name = "content_file_name",
        size = "content_file_size",
    } = fileColumns;

    const uuid = item[file] || null;
    const legacy = legacyReward(item, uuid);

    const type = item.reward_type || legacy.type;
    const body = item.reward_body || legacy.body;

    return emptyReward({
        title: item.reward_title || "",
        type,
        body: body || "",
        description: item.reward_description || "",
        file:
            type === "file" && uuid
                ? { uuid, name: item[name] || null, mime: item[mime] || null, size: item[size] || null }
                : null,
        perks: parsePerks(item.rewards),
    });
}

/**
 * What a listing created before the reward columns existed was actually
 * selling. Mirrors RewardService::withLegacy() on the server — without it a
 * legacy shop item with a confirmation message, or a legacy text task, opened
 * the edit form empty and saving replaced real content with nothing.
 */
function legacyReward(item, uuid) {
    // Shop: success_page_type 'url' | 'text', value in success_page_value.
    if (!item.reward_type && item.success_page_value) {
        return item.success_page_type === "url"
            ? { type: "link", body: item.success_page_value }
            : { type: "message", body: item.success_page_value };
    }

    // Task: a 'text' deliverable holds its content, not a file reference.
    if (!item.reward_type && item.deliverable_content_type === "text" && item.deliverable_content) {
        return { type: "message", body: item.deliverable_content };
    }

    // Wish: the old free-text `reward` column, used when there was no file.
    if (!item.reward_type && !uuid && typeof item.reward === "string" && item.reward.trim()) {
        return { type: "message", body: item.reward };
    }

    return { type: uuid ? "file" : "message", body: "" };
}

function parsePerks(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw !== "string" || !raw.trim()) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch {
        // Legacy rows store a comma-separated string rather than JSON.
    }
    return raw.split(",").map((value) => value.trim()).filter(Boolean);
}

/** The columns to submit, given the editor's value. */
export function rewardToPayload(value, fileColumns = {}) {
    const {
        file = "content_file",
        mime = "content_file_type",
        name = "content_file_name",
        size = "content_file_size",
    } = fileColumns;

    const isFile = value.type === "file";

    return {
        reward_title: (value.title || "").trim(),
        reward_type: value.type,
        // A file reward's content lives in the module's own column; sending a
        // leftover message alongside it would render both to the supporter.
        reward_body: isFile ? "" : (value.body || "").trim(),
        reward_description: (value.description || "").trim(),
        [file]: isFile ? value.file?.uuid || "" : "",
        [mime]: isFile ? value.file?.mime || "" : "",
        [name]: isFile ? value.file?.name || "" : "",
        [size]: isFile ? value.file?.size || 0 : 0,
    };
}

/**
 * Client-side mirror of the server rules, so the creator is told what is wrong
 * before a round trip. The server remains the authority.
 */
// `recurring` is accepted as well as `showPerks` so a caller using the editor's
// own prop name cannot silently skip the perks check — that is exactly the
// late-server-error the inline validation exists to prevent.
export function validateReward(value, { showPerks, recurring = false } = {}) {
    const requirePerks = showPerks ?? recurring;

    if (!value.title?.trim()) return "Add a reward title — supporters see this before they pay.";
    if (value.title.trim().length > REWARD_TITLE_MAX)
        return `Keep the reward title under ${REWARD_TITLE_MAX} characters.`;

    if (value.type === "file" && !value.file?.uuid) return "Upload the file supporters will receive.";
    if (value.type === "message" && !value.body?.trim()) return "Write the message supporters will receive.";

    if (value.type === "link") {
        const url = (value.body || "").trim();
        if (!url) return "Add the link supporters will receive.";
        if (!/^https:\/\//i.test(url)) return "Links must start with https://";
    }

    // Only tiered memberships sell a perks bundle. A Bill sells one recurring
    // content stream — its on-platform content IS the subscription, so a perks
    // requirement there would just be a box to tick.
    if (requirePerks && !value.perks.some((perk) => ON_PLATFORM_PERKS.includes(perk)))
        return "Pick at least one on-platform content benefit (monthly or weekly content bundle).";

    return null;
}

const LABEL = "block text-left text-[11px] font-black uppercase tracking-[0.14em] text-black";
const INPUT =
    "w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white px-4 py-3 text-base font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_0px_rgba(255,0,127,1)]";

/**
 * The one reward editor every add-item form uses.
 *
 * Before this, each module asked for its deliverable differently — or, for
 * bills and memberships, not at all — so a supporter could not tell what a
 * purchase would actually give them. One component means one answer, one set
 * of accepted file types, and one live preview of what the buyer will see.
 */
export default function RewardEditor({
    value,
    onChange,
    // `recurring` shows the "then, every period" block — the ongoing half of a
    // subscription. `showPerks` is what separates the two recurring products:
    // a Membership sells tiers with a perks bundle, a Bill sells one recurring
    // content stream and nothing else.
    recurring = false,
    showPerks = recurring,
    postAccessLabel = "Members-only posts",
    ongoingLabel = "Then, every month",
    memberPostsCount = 0,
    // Restrict the delivery types offered. A timed task has no file yet — its
    // deliverable is custom work handed over later — so "file" is excluded to
    // avoid a pre-uploaded file the buyer could download before it's delivered.
    allowedTypes = null,
    ctxName = "reward-file",
    errors = {},
    className = "",
}) {
    const uploaderRef = useRef();

    const types = allowedTypes
        ? REWARD_TYPES.filter((type) => allowedTypes.includes(type.value))
        : REWARD_TYPES;

    // If the current type is no longer offered (e.g. a legacy task saved as
    // "file" opened where only message/link are allowed), fall back to the
    // first allowed type so the editor never shows nothing selected.
    useEffect(() => {
        if (types.length && !types.some((type) => type.value === value.type)) {
            onChange({ ...value, type: types[0].value, file: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.type, allowedTypes]);

    const patch = useCallback((next) => onChange({ ...value, ...next }), [onChange, value]);

    const handleFile = useCallback(
        (upload) => {
            if (!upload?.uuid) return;
            patch({
                file: {
                    uuid: upload.uuid,
                    name: upload.name || "Your content",
                    mime: upload.mimeType ? `${upload.mimeType}/${upload.mimeSubtype}` : null,
                    size: upload.size || 0,
                },
            });
        },
        [patch],
    );

    const clearFile = useCallback(() => {
        patch({ file: null });
        uploaderRef.current?.reset?.();
    }, [patch]);

    const togglePerk = useCallback(
        (perkValue) => {
            const next = value.perks.includes(perkValue)
                ? value.perks.filter((perk) => perk !== perkValue)
                : [...value.perks, perkValue];
            patch({ perks: next });
        },
        [patch, value.perks],
    );

    const previewMedia = useMemo(() => {
        if (value.type !== "file" || !value.file?.uuid) return null;
        return {
            url: `https://ucarecdn.com/${value.file.uuid}/`,
            kind: rewardKind(value.file.mime, value.file.name),
            mime: value.file.mime,
            name: value.file.name,
            size: value.file.size,
        };
    }, [value.file, value.type]);

    const titleLeft = REWARD_TITLE_MAX - (value.title || "").length;

    return (
        <div className={`space-y-6 ${className}`}>
            <div>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                    <label htmlFor={`${ctxName}-title`} className={LABEL}>
                        What do they get? <span className="text-[#FF007F]">*</span>
                    </label>
                    <span
                        className={`text-[11px] font-bold ${titleLeft < 0 ? "text-[#FF007F]" : "text-neutral-400"}`}
                    >
                        {titleLeft}
                    </span>
                </div>
                <input
                    id={`${ctxName}-title`}
                    type="text"
                    value={value.title}
                    maxLength={REWARD_TITLE_MAX + 20}
                    onChange={(event) => patch({ title: event.target.value })}
                    placeholder="e.g. Behind-the-scenes studio video"
                    className={INPUT}
                />
                <p className="mt-2 text-left text-xs font-medium text-neutral-500">
                    Shown on your card, at checkout and on the receipt. Describe the content — not a
                    bill, expense or brand name.
                </p>
                {errors.reward_title && (
                    <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">{errors.reward_title}</p>
                )}
            </div>

            <div>
                <span className={`${LABEL} mb-2`}>
                    {recurring ? "They get this straight away" : "How is it delivered?"}
                </span>
                <div className={`grid gap-2 ${types.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                    {types.map((type) => {
                        const active = value.type === type.value;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => patch({ type: type.value })}
                                aria-pressed={active}
                                className={`min-h-[48px] rounded-box-sm border-[3px] border-black px-3 py-2 text-sm font-black uppercase tracking-wide transition-all ${
                                    active
                                        ? "translate-x-[2px] translate-y-[2px] bg-[#FF007F] text-white shadow-none"
                                        : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                }`}
                            >
                                {type.label}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-2 text-left text-xs font-medium text-neutral-500">
                    {types.find((type) => type.value === value.type)?.hint}
                </p>
            </div>

            {value.type === "file" && (
                <div>
                    {previewMedia ? (
                        <div className="space-y-3">
                            <RewardMedia media={previewMedia} compact />
                            <button
                                type="button"
                                onClick={clearFile}
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border-[3px] border-black bg-white px-4 text-xs font-black uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <Trash2 size={15} strokeWidth={2.5} /> Replace file
                            </button>
                        </div>
                    ) : (
                        <GlobalUploader
                            type="minimal"
                            view={false}
                            imgonly={false}
                            ctxName={ctxName}
                            ref={uploaderRef}
                            accept={REWARD_ACCEPT}
                            sendFile={handleFile}
                            options={st.wishlistcontent}
                        />
                    )}
                    <p className="mt-3 text-left text-xs font-medium text-neutral-500">
                        Video, photo, audio, PDF, documents or a zip.
                    </p>
                </div>
            )}

            {value.type === "message" && (
                <div>
                    <textarea
                        rows={5}
                        value={value.body}
                        maxLength={REWARD_MESSAGE_MAX}
                        onChange={(event) => patch({ body: event.target.value })}
                        placeholder="Write the content they unlock — lyrics, a recipe, a workout plan, your access details…"
                        className={`${INPUT} resize-y`}
                    />
                    <p className="mt-2 text-left text-xs font-medium text-neutral-500">
                        Delivered on the thank-you page the moment the payment clears.
                    </p>
                </div>
            )}

            {value.type === "link" && (
                <div>
                    <input
                        type="url"
                        inputMode="url"
                        value={value.body}
                        onChange={(event) => patch({ body: event.target.value })}
                        placeholder="https://"
                        className={INPUT}
                    />
                    <p className="mt-2 text-left text-xs font-medium text-neutral-500">
                        Must start with https://. Shortened links are not accepted — paste the real
                        destination so supporters can see where they are going.
                    </p>
                    {value.body?.trim() && /^https:\/\//i.test(value.body.trim()) && (
                        <div className="mt-3">
                            <RewardLink url={value.body.trim()} />
                        </div>
                    )}
                </div>
            )}

            {errors.reward_body && (
                <p className="-mt-3 text-left text-xs font-bold text-[#FF007F]">{errors.reward_body}</p>
            )}

            {recurring && (
                <div className="space-y-4 rounded-box border-[3px] border-black bg-[#F7F7F7] p-4">
                    {showPerks && (
                    <div>
                        <span className={`${LABEL} mb-1`}>{ongoingLabel}</span>
                        <p className="mb-3 text-left text-xs font-medium text-neutral-500">
                            Pick at least one on-platform content benefit — a paid subscription has to
                            deliver content here.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {REWARD_PERKS.map((perk) => {
                                const active = value.perks.includes(perk.value);
                                const required = ON_PLATFORM_PERKS.includes(perk.value);
                                return (
                                    <button
                                        key={perk.value}
                                        type="button"
                                        onClick={() => togglePerk(perk.value)}
                                        aria-pressed={active}
                                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-box-sm border-[3px] border-black px-4 text-xs font-black uppercase tracking-wide transition-all ${
                                            active
                                                ? "translate-x-[2px] translate-y-[2px] bg-[#A2E4B8] shadow-none"
                                                : "bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                                        }`}
                                    >
                                        {active && <Check size={14} strokeWidth={3} />}
                                        {perk.label}
                                        {required && <Sparkles size={13} strokeWidth={2.5} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    )}

                    <div className="flex items-start gap-3 rounded-box-sm border-[3px] border-black bg-white p-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-box-sm border-2 border-black bg-[#FFE500]">
                            <Lock size={16} strokeWidth={2.5} />
                        </span>
                        <span className="text-left">
                            <span className="block text-xs font-black uppercase tracking-wide">
                                {postAccessLabel}
                            </span>
                            <span className="block text-xs font-medium text-neutral-500">
                                Included automatically
                                {memberPostsCount > 0 ? ` — ${memberPostsCount} posts unlocked today` : ""}
                            </span>
                        </span>
                    </div>
                </div>
            )}

            <div>
                <label htmlFor={`${ctxName}-desc`} className={`${LABEL} mb-2`}>
                    Extra detail <span className="font-bold text-neutral-400">(optional)</span>
                </label>
                <input
                    id={`${ctxName}-desc`}
                    type="text"
                    value={value.description}
                    maxLength={REWARD_DESCRIPTION_MAX}
                    onChange={(event) => patch({ description: event.target.value })}
                    placeholder="e.g. 12 minutes, filmed last week"
                    className={INPUT}
                />
                {errors.reward_description && (
                    <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                        {errors.reward_description}
                    </p>
                )}
            </div>
        </div>
    );
}
