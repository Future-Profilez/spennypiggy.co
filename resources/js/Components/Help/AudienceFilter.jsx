import { Link } from "@inertiajs/react";

/**
 * "Written for creators / for supporters / everything".
 *
 * ⚠️ This is a FILTER, never a gate. Every article stays readable at its own URL
 * whatever is selected here — a supporter following a link to a creator article
 * reads it in full. Hiding it would 404 a URL that is in the sitemap.
 *
 * ⚠️ The set of options is FIXED and a zero-count option is never removed. An
 * option that appears and disappears as content is published means the reader
 * cannot learn where anything is, and "for supporters" simply vanishing reads as
 * the page being broken rather than as nothing being filed there yet.
 */
const OPTIONS = [
    { value: null, label: "Everything", param: "all" },
    { value: "creator", label: "For creators", param: "creator" },
    { value: "supporter", label: "For supporters", param: "supporter" },
];

export default function AudienceFilter({ current, viewerAudience, basePath }) {
    return (
        <nav aria-label="Filter by who the answer is for" className="flex flex-wrap gap-2">
            {OPTIONS.map((opt) => {
                const active = current === opt.value;

                return (
                    <Link
                        key={opt.param}
                        href={`${basePath}?for=${opt.param}`}
                        preserveScroll
                        aria-current={active ? "true" : undefined}
                        className={[
                            "inline-flex min-h-[44px] items-center rounded-box-sm border-2 border-black px-4 py-2 text-sm font-bold",
                            active ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white",
                        ].join(" ")}
                    >
                        {opt.label}
                        {/* Says why the page opened filtered — an unexplained
                            default filter reads as missing content. */}
                        {active && opt.value && opt.value === viewerAudience && (
                            <span className="ml-2 text-xs font-semibold uppercase tracking-wider opacity-70">
                                your account
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
