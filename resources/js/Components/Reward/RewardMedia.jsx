import { useMemo } from "react";
import LazyVideo from "@/Components/LazyVideo";
import { rewardKind } from "@/constants/rewards";
import {
    FileText,
    FileArchive,
    FileAudio,
    Download,
    File as FileIcon,
    ExternalLink,
} from "lucide-react";

function formatSize(bytes) {
    if (!bytes || bytes <= 0) return null;
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

const TILE_ICON = {
    pdf: FileText,
    document: FileText,
    archive: FileArchive,
    audio: FileAudio,
};

/**
 * Renders a reward file the way the supporter will actually receive it —
 * playable, viewable, or a download tile — from the normalised `media` object
 * RewardService produces.
 *
 * Video deliberately uses LazyVideo: no autoplay and preload="none", so a card
 * that is merely on screen never pulls video bytes.
 */
export default function RewardMedia({ media, poster, compact = false, className = "" }) {
    const kind = useMemo(() => {
        if (!media) return null;
        return media.kind || rewardKind(media.mime, media.name || media.url);
    }, [media]);

    if (!media?.url) return null;

    const size = formatSize(media.size);
    const name = media.name || "Your content";
    const frame = `overflow-hidden rounded-box-sm border-[3px] border-black bg-black ${className}`;

    if (kind === "image") {
        return (
            <div className={frame}>
                <img
                    src={media.url}
                    alt={name}
                    loading="lazy"
                    className={`w-full ${compact ? "max-h-52" : "max-h-[420px]"} object-contain bg-neutral-100`}
                />
            </div>
        );
    }

    if (kind === "video") {
        return (
            <div className={frame}>
                <LazyVideo
                    src={media.url}
                    fallback={poster}
                    controls
                    playsInline
                    className={`w-full ${compact ? "max-h-52" : "max-h-[420px]"}`}
                />
            </div>
        );
    }

    if (kind === "audio") {
        return (
            <div className="rounded-box-sm border-[3px] border-black bg-[#A2E4B8] p-4">
                <p className="mb-3 truncate text-sm font-black uppercase tracking-wide">{name}</p>
                <audio controls preload="none" src={media.url} className="w-full" />
            </div>
        );
    }

    const Icon = TILE_ICON[kind] || FileIcon;

    return (
        <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[64px] items-center gap-3 rounded-box-sm border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-box-sm border-2 border-black bg-[#FFE500]">
                <Icon size={20} strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black uppercase tracking-wide">{name}</span>
                <span className="block text-xs font-semibold text-neutral-500">
                    {[kind === "file" ? "Download" : kind.toUpperCase(), size].filter(Boolean).join(" · ")}
                </span>
            </span>
            <Download size={18} strokeWidth={2.5} className="shrink-0" />
        </a>
    );
}

/** A link reward — shown with its real destination, never a bare "click here". */
export function RewardLink({ url }) {
    if (!url) return null;

    let host = url;
    try {
        host = new URL(url).host.replace(/^www\./, "");
    } catch {
        // A malformed link still renders; the label just falls back to the raw
        // string rather than throwing inside a render.
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[64px] items-center gap-3 rounded-box-sm border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-box-sm border-2 border-black bg-[#A2E4B8]">
                <ExternalLink size={20} strokeWidth={2.5} />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black uppercase tracking-wide">Open your content</span>
                <span className="block truncate text-xs font-semibold text-neutral-500">{host}</span>
            </span>
        </a>
    );
}
