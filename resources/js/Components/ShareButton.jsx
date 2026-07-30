import React, { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

/**
 * Share a single listing.
 *
 * Replaces the per-page ad-hoc buttons. One of those was an Instagram "share" that
 * opened `instagram.com/?url=…` — Instagram has no URL-share endpoint, so it never
 * shared anything; it just opened Instagram.
 *
 * On a phone (and in the installed PWA) this opens the real OS share sheet, which is
 * where people actually share from. Everywhere else it falls back to copy-link plus
 * the two platforms that do accept a URL.
 *
 * The link itself carries a utm source (added server-side in ItemShareService) so the
 * traffic a creator sends is attributable instead of landing in the funnels as `direct`.
 *
 * Usage: <ShareButton share={item.share} />  // { url, title, caption }
 */
export default function ShareButton({ share, label = "Share", className = "" }) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    const url = share?.url;
    const caption = share?.caption || share?.title || "";

    if (!url) return null;

    const stop = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
    };

    const copy = async (e) => {
        stop(e);

        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // Clipboard API needs a secure context and permission. A textarea +
            // execCommand still works everywhere else, and silently failing to copy
            // is worse than a deprecated call.
            const field = document.createElement("textarea");
            field.value = url;
            field.setAttribute("readonly", "");
            field.style.position = "absolute";
            field.style.left = "-9999px";
            document.body.appendChild(field);
            field.select();
            document.execCommand("copy");
            document.body.removeChild(field);
        }

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const nativeShare = async (e) => {
        stop(e);

        if (!navigator.share) {
            setOpen((v) => !v);
            return;
        }

        try {
            await navigator.share({ title: share?.title || "", text: caption, url });
        } catch {
            // AbortError just means they dismissed the sheet — not something to report.
        }
    };

    const openWindow = (target) => (e) => {
        stop(e);
        window.open(target, "_blank", "noopener,noreferrer");
    };

    const encoded = encodeURIComponent(url);
    const encodedCaption = encodeURIComponent(caption);

    return (
        <div className={`relative ${className}`} onClick={stop}>
            <button
                type="button"
                onClick={nativeShare}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-box-sm border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase text-black transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                aria-label={label}
            >
                <Share2 size={16} strokeWidth={2.6} />
                {label}
            </button>

            {/* Fallback list, only on browsers with no share sheet. */}
            {open && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-box border-2 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <button
                        type="button"
                        onClick={copy}
                        className="flex w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100 min-h-[44px]"
                    >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? "Link copied" : "Copy link"}
                    </button>

                    <button
                        type="button"
                        onClick={openWindow(
                            `https://wa.me/?text=${encodedCaption}%20${encoded}`,
                        )}
                        className="flex w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100 min-h-[44px]"
                    >
                        WhatsApp
                    </button>

                    <button
                        type="button"
                        onClick={openWindow(
                            `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedCaption}`,
                        )}
                        className="flex w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100 min-h-[44px]"
                    >
                        X
                    </button>

                    <button
                        type="button"
                        onClick={openWindow(
                            `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
                        )}
                        className="flex w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100 min-h-[44px]"
                    >
                        Facebook
                    </button>
                </div>
            )}
        </div>
    );
}
