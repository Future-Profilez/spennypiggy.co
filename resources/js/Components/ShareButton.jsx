import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
    const [showQr, setShowQr] = useState(false);
    const shareButtonRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState(null);

    const url = share?.url;
    const caption = share?.caption || share?.title || "";

    const positionMenu = () => {
        const rect = shareButtonRef.current?.getBoundingClientRect();
        if (!rect) return;

        setMenuPosition({
            // Keep the menu below the share control so it never covers the
            // trigger or the QR button. The portal keeps it outside the card.
            top: rect.bottom + 8,
            left: Math.min(Math.max(8, rect.left), window.innerWidth - 232),
        });
    };

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
            setOpen((v) => {
                const next = !v;
                if (next) {
                    positionMenu();
                }
                return next;
            });
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

    useEffect(() => {
        if (!open) return undefined;

        const updateMenuPosition = () => {
            positionMenu();
        };

        updateMenuPosition();
        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);

        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
        };
    }, [open]);

    if (!url) return null;

    const fallbackMenu = open && menuPosition && typeof document !== "undefined"
        ? createPortal(
              <div
                  className="fixed z-[1000004] w-56 rounded-box border-2 border-black bg-white p-2"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                  onClick={stop}
              >
                  <button
                      type="button"
                      onClick={copy}
                      className="flex min-h-[44px] w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100"
                  >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? "Link copied" : "Copy link"}
                  </button>

                  <button
                      type="button"
                      onClick={openWindow(
                          `https://wa.me/?text=${encodedCaption}%20${encoded}`,
                      )}
                      className="flex min-h-[44px] w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100"
                  >
                      WhatsApp
                  </button>

                  <button
                      type="button"
                      onClick={openWindow(
                          `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedCaption}`,
                      )}
                      className="flex min-h-[44px] w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100"
                  >
                      X
                  </button>

                  <button
                      type="button"
                      onClick={openWindow(
                          `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
                      )}
                      className="flex min-h-[44px] w-full items-center gap-2 rounded-box-sm px-3 py-2 text-left text-sm font-bold hover:bg-gray-100"
                  >
                      Facebook
                  </button>
              </div>,
              document.body,
          )
        : null;

    return (
        <div className={`relative ${className}`} onClick={stop}>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    ref={shareButtonRef}
                    onClick={nativeShare}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-box-sm border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase text-black transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                    aria-label={label}
                >
                    <Share2 size={16} strokeWidth={2.6} />
                    {label}
                </button>

                {/* Its own control rather than a menu row: the QR is for getting the
                    link off a desktop screen and onto a phone, or handing it over in
                    person — and on mobile the menu never opens, because the OS share
                    sheet takes over. */}
                <button
                    type="button"
                    onClick={(e) => {
                        stop(e);
                        setShowQr((v) => !v);
                    }}
                    aria-expanded={showQr}
                    aria-label={showQr ? "Hide QR code" : "Show QR code"}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-box-sm border-2 border-black bg-white text-black transition-all hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                    <QrCode size={18} strokeWidth={2.4} />
                </button>
            </div>

            {showQr && (
                <div className="mt-2 inline-block rounded-box border-2 border-black bg-white p-3">
                    {/* White background is not decoration — a scanner needs the quiet
                        zone and the contrast to read the code at all. */}
                    <QRCodeSVG value={url} size={148} level="M" marginSize={2} />
                    <p className="mt-2 max-w-[148px] text-center text-[12px] font-bold text-zinc-500">
                        Scan to open
                    </p>
                </div>
            )}

            {fallbackMenu}
        </div>
    );
}
