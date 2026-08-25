/**
 * Client-side mirror of config/rewards.php — keep the two in step.
 *
 * Every add-item form used to hardcode its own `accept` string, which is why
 * the modules disagreed about what a creator could upload (Tasks took .rar but
 * no office documents; Bills had no upload field at all). One list now feeds
 * every uploader, and the server validates against the same set.
 */

export const DEFAULT_REWARD_TITLE = "Exclusive reward";

export const REWARD_TITLE_MAX = 60;
export const REWARD_DESCRIPTION_MAX = 300;
export const REWARD_MESSAGE_MAX = 2000;

/** What the supporter receives immediately. */
export const REWARD_TYPES = [
    {
        value: "file",
        label: "File",
        hint: "Video, photo, audio, PDF or document they can open straight away",
    },
    {
        value: "message",
        label: "Message",
        hint: "Written content delivered on the thank-you page",
    },
    {
        value: "link",
        label: "Link",
        hint: "A destination you control — must be https, no shorteners",
    },
];

export const REWARD_ACCEPT = [
    // MIME types — the primary filter.
    "image/*",
    "video/*",
    "audio/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/rtf",
    "application/epub+zip",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/vnd.rar",
    // Extensions too — some OS file pickers and the Uploadcare native input
    // filter on extension rather than the reported MIME, so a .zip/.docx that
    // reports application/octet-stream still shows up.
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".heic", ".bmp", ".svg",
    ".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv",
    ".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac",
    ".pdf", ".doc", ".docx", ".rtf", ".txt", ".odt",
    ".xls", ".xlsx", ".ppt", ".pptx", ".epub",
    ".zip", ".rar", ".7z", ".tar", ".gz",
].join(",");

/** Thumbnails and cover images — never the paid deliverable. */
export const IMAGE_ACCEPT = "image/*";

const KIND_EXTENSIONS = {
    image: ["jpg", "jpeg", "png", "gif", "webp", "avif", "heic", "bmp", "svg"],
    video: ["mp4", "webm", "mov", "m4v", "avi", "mkv"],
    audio: ["mp3", "wav", "ogg", "m4a", "aac", "flac"],
    pdf: ["pdf"],
    document: ["doc", "docx", "rtf", "txt", "odt", "xls", "xlsx", "ppt", "pptx", "epub"],
    archive: ["zip", "rar", "7z", "tar", "gz"],
};

/**
 * image | video | audio | pdf | document | archive | file
 * Mirrors RewardService::kind() — MIME first, then extension. A bare
 * Uploadcare UUID carries neither, so it falls back to a download tile.
 */
export function rewardKind(mime, nameOrUrl) {
    const type = String(mime || "").toLowerCase();

    if (type) {
        for (const prefix of ["image", "video", "audio"]) {
            if (type.startsWith(`${prefix}/`)) return prefix;
        }
        if (type === "application/pdf") return "pdf";

        /*
         * 🚨 A BARE KIND, NOT A MIME TYPE — kept in step with
         * `RewardService::kind()`, which carries the full note. `ShopsController`
         * used to store the literal `'image'` when Uploadcare reported no mime;
         * the checks above need the `prefix/` form, so those listings resolved to
         * "file" and rendered a download tile instead of the picture.
         */
        if (!type.includes("/") && Object.hasOwn(KIND_EXTENSIONS, type)) return type;
    }

    const path = String(nameOrUrl || "").split("?")[0].split("#")[0];
    const extension = path.includes(".") ? path.split(".").pop().toLowerCase() : "";

    if (extension) {
        for (const [kind, extensions] of Object.entries(KIND_EXTENSIONS)) {
            if (extensions.includes(extension)) return kind;
        }
    }

    return "file";
}

/** Ongoing perks for recurring items (bills + memberships). */
export const REWARD_PERKS = [
    { value: "monthly_content_bundle", label: "Monthly content bundle" },
    { value: "weekly_content_bundle", label: "Weekly content bundle" },
    { value: "monthly_DM_chat", label: "Monthly DM chat" },
    { value: "weekly_DM_chat", label: "Weekly DM chat" },
    { value: "monthly_video_call", label: "Monthly video call" },
    { value: "weekly_video_call", label: "Weekly video call" },
    { value: "green_circle_insta", label: "Green circle on Instagram" },
    { value: "insta_broadcast", label: "Instagram broadcast channel" },
    { value: "telegram_group", label: "Telegram group" },
    { value: "x_community", label: "X community" },
];

/**
 * Stripe compliance: a recurring content subscription must deliver content on
 * this platform, so at least one of these must be selected.
 */
export const ON_PLATFORM_PERKS = ["monthly_content_bundle", "weekly_content_bundle"];

export function hasOnPlatformPerk(perks) {
    const list = Array.isArray(perks)
        ? perks
        : String(perks || "")
              .split(",")
              .map((value) => value.trim());

    return list.some((value) => ON_PLATFORM_PERKS.includes(value));
}

/**
 * The "what you get" lines for a checkout summary: the creator's own reward
 * headline first, then its detail. Every payment surface prepends these to its
 * generic delivery copy, so a buyer is always told what the money buys before
 * they are told how it arrives.
 *
 * Never includes `reward_body` — that is the paid content, and the buyer has
 * not paid yet.
 */
export function rewardLines(item) {
    if (!item) return [];

    const title = String(item.reward_title || "").trim();
    const detail = String(item.reward_description || "").trim();

    return [title || DEFAULT_REWARD_TITLE, detail].filter(Boolean);
}
