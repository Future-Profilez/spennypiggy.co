import { Link } from "@inertiajs/react";
import { ChevronRight, LifeBuoy } from "lucide-react";

/**
 * Where you are in the help centre.
 *
 * 🚨 THE FULL TRAIL, NOT JUST "BACK". Both inner pages used to render one link
 * to the level above — the article's pointed at its category, the category's at
 * the directory — so from an article there was no way to the directory but two
 * taps, and no way to see which of the nine sections you were standing in
 * without reading the URL. A trail answers "where am I" and "how do I get out"
 * in the same row.
 *
 * ⚠️ The LAST crumb is plain text with `aria-current="page"`, never a link to
 * the page you are on. A link that reloads the current page is how a reader
 * decides navigation is broken.
 *
 * ⚠️ It scrolls sideways rather than wrapping (`overflow-x-auto` + `nowrap`).
 * A wrapped trail on a 320px screen is two lines of chrome above the heading,
 * and the crumb that gets pushed onto line two is always the one that matters
 * (the section). The scrollbar is hidden — the chevrons already say there is
 * more to the right.
 *
 * ⚠️ Server-side breadcrumb JSON-LD is applied separately in
 * HelpController::applyArticleSeo. This is the visible one; keep them in step.
 */
export default function HelpBreadcrumb({ trail = [], className = "" }) {
    if (trail.length === 0) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            className={`-mx-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
        >
            <ol className="flex items-center gap-1 whitespace-nowrap px-1 text-[13px]">
                <li className="flex items-center">
                    <Link
                        href="/help"
                        className="help-focus inline-flex min-h-[44px] items-center gap-1.5 rounded-box-xs px-1.5 font-semibold text-black/70 transition-opacity duration-200 hover:text-black hover:opacity-100"
                    >
                        <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
                        Help Centre
                    </Link>
                </li>

                {trail.map((crumb, i) => {
                    const last = i === trail.length - 1;

                    return (
                        <li key={crumb.href ?? crumb.label} className="flex items-center">
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-black/45" aria-hidden="true" />
                            {last || !crumb.href ? (
                                <span
                                    aria-current={last ? "page" : undefined}
                                    className="inline-flex min-h-[44px] max-w-[52vw] items-center overflow-hidden text-ellipsis px-1.5 font-semibold text-black sm:max-w-none"
                                >
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    href={crumb.href}
                                    className="help-focus inline-flex min-h-[44px] max-w-[52vw] items-center overflow-hidden text-ellipsis rounded-box-xs px-1.5 font-semibold text-black/70 transition-opacity duration-200 hover:text-black sm:max-w-none"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
