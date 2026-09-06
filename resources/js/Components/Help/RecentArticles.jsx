import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { History, X } from "lucide-react";
import { clearHelpRecents, readHelpRecents } from "@/lib/helpRecents";

/**
 * "Pick up where you left off" for the help centre.
 *
 * Somebody who came back is nearly always coming back to the SAME problem, and
 * before this they searched for it a second time. This is device-local only —
 * see lib/helpRecents.js for why that is a rule rather than a shortcut.
 *
 * 🚨 READ IN AN EFFECT, SO THE FIRST PAINT MATCHES THE SERVER. SSR is on for
 * /help; reading storage during render would both throw on the render host and
 * produce markup the client then contradicts. It renders nothing until mounted,
 * which is also the honest state — the server genuinely does not know this.
 */
export default function RecentArticles({ className = "" }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        setItems(readHelpRecents());
    }, []);

    if (items.length === 0) return null;

    return (
        <section aria-labelledby="help-recent-heading" className={className}>
            <div className="flex items-center justify-between gap-3">
                <h2
                    id="help-recent-heading"
                    className="flex items-center gap-1.5 font-gulfs text-[11px] uppercase tracking-[0.18em] text-black/60"
                >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    You were reading
                </h2>

                {/* On a shared device this is the control that matters most, so
                    it is a real button rather than a setting somewhere else. */}
                <button
                    type="button"
                    onClick={() => {
                        clearHelpRecents();
                        setItems([]);
                    }}
                    className="help-focus inline-flex min-h-[36px] items-center gap-1 rounded-box-xs px-2 text-[12px] font-semibold text-black/60 transition-opacity duration-200 hover:text-black"
                >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Clear
                </button>
            </div>

            {/* A horizontal rail on a phone: five stacked rows would push the
                whole directory below the fold to show things already read. */}
            <ul className="-mx-4 mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
                {items.map((a) => (
                    <li key={a.slug} className="min-w-[72%] snap-start sm:min-w-0">
                        <Link
                            href={`/help/${a.category_slug}/${a.slug}`}
                            className="help-focus flex h-full min-h-[44px] flex-col justify-center rounded-box-sm border-black bg-white px-3 py-2 transition-colors duration-200 hover:bg-[#F4F4F5]"
                        >
                            {a.category_title && (
                                <span className="block truncate font-gulfs text-[10px] uppercase tracking-[0.14em] text-black/60">
                                    {a.category_title}
                                </span>
                            )}
                            <span className="block text-[13px] font-semibold leading-[1.35] text-black line-clamp-2 sm:max-w-[220px]">
                                {a.title}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
