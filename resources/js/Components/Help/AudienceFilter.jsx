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
 *
 * 🚨 ONE SEGMENTED CONTROL, NOT THREE PILLS (6 Sep 2026). As three separate
 * 44px pills it wrapped onto two lines at 320px and read as three unrelated
 * buttons — so the fact that they are one either/or choice, and that one of them
 * is always on, was invisible. It is one frame with hairline divisions now (the
 * house abutting device), which also makes the selected cell obvious without
 * needing a tick.
 *
 * ⚠️ The hairline is `divide-x`, never a border per cell: adjacent borders
 * double to 4px and need a per-position reset at every breakpoint.
 */
const OPTIONS = [
    { value: null, label: "Everything", param: "all" },
    { value: "creator", label: "For creators", param: "creator" },
    { value: "supporter", label: "For supporters", param: "supporter" },
];

export default function AudienceFilter({ current, viewerAudience, basePath, className = "" }) {
    const activeIsYours = OPTIONS.some((o) => o.value && o.value === current && o.value === viewerAudience);

    return (
        <div className={className}>
            <nav
                aria-label="Filter by who the answer is for"
                className="grid grid-cols-3 divide-x-2 divide-black overflow-hidden rounded-box-sm border-black bg-white"
            >
                {OPTIONS.map((opt) => {
                    const active = current === opt.value;

                    return (
                        <Link
                            key={opt.param}
                            href={`${basePath}?for=${opt.param}`}
                            preserveScroll
                            aria-current={active ? "true" : undefined}
                            className={[
                                "help-focus flex min-h-[44px] items-center justify-center px-2 text-center text-[12px] font-bold leading-[1.2] transition-colors duration-200 sm:text-[13px]",
                                active ? "bg-black text-white" : "text-black/70 hover:bg-[#F4F4F5] hover:text-black",
                            ].join(" ")}
                        >
                            {opt.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Says why the page opened filtered — an unexplained default filter
                reads as missing content. Below the control rather than inside a
                cell, where it used to squeeze the label it was explaining. */}
            {activeIsYours && (
                <p className="mt-1.5 text-[12px] text-black/55">
                    Filtered to your account. Pick <span className="font-semibold text-black">Everything</span> to see the
                    rest.
                </p>
            )}
        </div>
    );
}
