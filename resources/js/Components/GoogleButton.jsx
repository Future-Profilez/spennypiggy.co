/**
 * "Continue with Google".
 *
 * A plain <a>, not a fetch: the whole point is to leave the site for Google's consent screen,
 * and an XHR cannot do that. It also means the button works with JavaScript disabled and can
 * be opened in a new tab.
 *
 * Renders nothing when the credentials are not configured — a button that answers
 * "Google sign-in is not available right now" is worse than no button.
 */

const GoogleMark = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
        />
        <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z"
        />
        <path
            fill="#FBBC05"
            d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"
        />
        <path
            fill="#EA4335"
            d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
        />
    </svg>
);

export default function GoogleButton({
    enabled,
    label = "Continue with Google",
    className = "",
}) {
    if (!enabled) return null;

    const href = typeof window !== "undefined" && window.location.search
        ? `${route("auth.google")}${window.location.search}`
        : route("auth.google");

    return (
        <a
            href={href}
            className={`flex min-h-[52px] w-full items-center justify-center gap-3 rounded-box-sm border-[3px] border-black bg-white px-5 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 motion-reduce:hover:translate-y-0 ${className}`}
        >
            <GoogleMark />
            {label}
        </a>
    );
}

/**
 * "or" rule, for separating the button from a password form.
 *
 * `tone` exists because the two pages that use it have opposite backgrounds: register is on
 * near-black, login is on a white card over mint. A single white-on-transparent rule was
 * invisible on one of them.
 */
export function AuthDivider({ label = "or", tone = "dark" }) {
    const line = tone === "light" ? "bg-black/10" : "bg-white/15";
    const text = tone === "light" ? "text-black/60" : "text-white/60";

    return (
        <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className={`h-px flex-1 ${line}`} />
            <span
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${text}`}
            >
                {label}
            </span>
            <span className={`h-px flex-1 ${line}`} />
        </div>
    );
}
