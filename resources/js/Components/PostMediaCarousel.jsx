import { useEffect, useRef, useState } from "react";
import LazyVideo from "@/Components/LazyVideo";

/**
 * Instagram-style media carousel for a post's images/videos.
 *
 * One implementation for the feed card and the post detail page — before this
 * each surface had its own arrows-and-dots code and they disagreed about how a
 * media item's URL is built.
 *
 * Swipe (touch + trackpad drag), arrow keys when focused, dots, and a counter.
 * Video never autoplays and never preloads bytes (LazyVideo).
 */

// `-/quality/85/` is NOT a valid Uploadcare operation — the CDN answers 400 and
// every multi-image post rendered a broken thumbnail. Quality takes named
// values (smart/normal/better/best/lighter/lightest).
const IMAGE_OPS = "-/format/jpeg/-/quality/smart/";

export function mediaSrc(media, { transform = true } = {}) {
    const raw = media?.uuid || media?.url || "";
    if (!raw) return "";
    if (raw.startsWith("http")) return raw;
    const base = `https://ucarecdn.com/${raw}/`;
    // A uuid that already carries operations (AI-watermarked images do) must not
    // get a second set appended.
    if (raw.includes("/-/")) return base;

    return transform && !media?.isVideo ? base + IMAGE_OPS : base;
}

export function isVideoItem(media) {
    return Boolean(media?.isVideo || media?.mimeType?.startsWith?.("video"));
}

const SWIPE_THRESHOLD = 40;

export default function PostMediaCarousel({
    items = [],
    heightClass = "h-[260px] sm:h-[320px]",
    rounded = "rounded-box",
    posterFallback = null,
    onOpen = null,
    className = "",
}) {
    const [index, setIndex] = useState(0);
    const startX = useRef(null);
    const trackRef = useRef(null);
    const count = items.length;

    useEffect(() => {
        if (index > count - 1) setIndex(0);
    }, [count, index]);

    if (count === 0) return null;

    const go = (next) => setIndex((i) => (next + count) % count);

    const onKeyDown = (e) => {
        if (count < 2) return;
        if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
        }
    };

    const onTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e) => {
        if (startX.current === null) return;
        const dx = e.changedTouches[0].clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        go(dx < 0 ? index + 1 : index - 1);
    };

    const arrow = (dir) => (
        <button
            type="button"
            aria-label={dir === 1 ? "Next media" : "Previous media"}
            onClick={(e) => {
                e.stopPropagation();
                go(index + dir);
            }}
            className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-sm font-black text-white backdrop-blur-sm transition-colors hover:bg-black/75 sm:flex ${
                dir === 1 ? "right-3" : "left-3"
            }`}
        >
            {dir === 1 ? "→" : "←"}
        </button>
    );

    return (
        <div
            ref={trackRef}
            tabIndex={count > 1 ? 0 : -1}
            onKeyDown={onKeyDown}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className={`relative overflow-hidden bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F] ${rounded} ${className}`}
            aria-roledescription={count > 1 ? "carousel" : undefined}
        >
            {/* One sliding track: the browser keeps decoded neighbours around, so
                moving between slides has no flash of empty space. */}
            <div
                className={`flex w-full transition-transform duration-300 ease-out ${heightClass}`}
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {items.map((media, i) => {
                    const src = mediaSrc(media);
                    return (
                        <div key={`${media.uuid || i}`} className="w-full shrink-0 grow-0 basis-full">
                            {isVideoItem(media) ? (
                                <LazyVideo
                                    src={mediaSrc(media, { transform: false })}
                                    fallback={posterFallback}
                                    className="h-full w-full object-cover"
                                    controls
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <img
                                    src={src}
                                    alt={`Post media ${i + 1} of ${count}`}
                                    loading={i === 0 ? "eager" : "lazy"}
                                    className="h-full w-full object-cover"
                                    onClick={
                                        onOpen
                                            ? (e) => {
                                                  e.stopPropagation();
                                                  onOpen(i);
                                              }
                                            : undefined
                                    }
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {count > 1 && (
                <>
                    {arrow(-1)}
                    {arrow(1)}

                    {/* Bottom-right, not top-right: the card's audience badge
                        ("Members only") already owns the top-right corner and the
                        two overlapped. */}
                    <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-black text-white">
                        {index + 1}/{count}
                    </span>

                    <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Go to media ${i + 1}`}
                                aria-current={i === index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIndex(i);
                                }}
                                className={`h-1.5 rounded-full transition-all ${
                                    i === index ? "w-4 bg-white" : "w-1.5 bg-white/55"
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
