import { Link, usePage } from '@inertiajs/react';

/**
 * Moving between the creator guides — the last block on every `/creators/*` page.
 *
 * ⚠️ Rendered on the DARK field, and it sits DIRECTLY UNDER THE CALL TO ACTION,
 * so it must never be the loudest thing at the foot of the page. It was a cream
 * card with black-bordered pills; then a quiet outlined pill row; it is now an
 * index, for the reasons below.
 *
 * 🚨 EIGHT PILLS IN A `flex-wrap` ALWAYS BREAK RAGGED. At 1440px the row broke
 * 7 + 1 and left "Link in bio" orphaned on a line of its own — the last item of
 * the set reading as an afterthought. A wrap point is decided by the viewport
 * and the label lengths, so it cannot be tuned; it can only be replaced by a
 * grid that states the row count. Two columns × four rows, one column on a
 * phone, and there is no wrap left to go wrong.
 *
 * 🚨 THE CURRENT PAGE IS NOT A LINK. It used to render as a pill linking to the
 * page you were already reading — a dead click, and the only pink fill on the
 * screen was spent saying "you are here". The active row is a `<span>` with
 * `aria-current="page"`, marked the way `includes/Header.jsx` marks its active
 * nav link: **by contrast, not by hue** — full-strength white against
 * `white/55`, with the accent reduced to that row's own hairline.
 *
 * 🚨 THE ACTIVE TEST COMPARES PATHNAMES, NEVER `startsWith`. Every one of these
 * hrefs begins with `/creators`, so `url.startsWith(p.href)` marked the Overview
 * row active on all six pages — two rows lit at once, saying the reader was in
 * two places. `usePage().url` also carries the query string, so the comparison
 * has to be made against the path alone.
 *
 * ⚠️ Depth here is a border and space, per the house rule — no shadow, and no
 * scale or lift on hover. A row answers with its own type going to full white.
 */
export default function CreatorGuideLinks() {
    const { url } = usePage();

    const pages = [
        { href: '/creators', label: 'Overview' },
        { href: '/creators/features', label: '7 ways to earn' },
        { href: '/creators/keep-100', label: 'Keep 100%' },
        { href: '/creators/founder-bonus', label: 'Founder bonus' },
        { href: '/creators/stripe-safe', label: 'Stripe safe' },
        { href: '/creators/disputes', label: 'Disputes' },
        { href: '/creators/discovery', label: 'Get discovered' },
        { href: '/creators/link-in-bio', label: 'Link in bio' },
        { href: '/creators/wishlist', label: 'Wishlist' },
        // Client spec v4.3 §2 — "Compare" is added to this nav on every
        // /creators page, and ships with the first published comparison.
        { href: '/creators/compare', label: 'Compare' },
    ];

    const path = (url || '').split('?')[0].replace(/\/$/, '') || '/creators';

    /*
     * The label is the whole row, so it carries the display face at the size the
     * eyebrow above it uses — an index reads as one family of type, not as a
     * heading with smaller controls under it.
     */
    const LABEL = 'font-gulfs text-[13px] uppercase tracking-[0.14em] transition-colors duration-200';

    return (
        <nav
            aria-label="Creator guides"
            className="mt-16 border-t-2 border-white/15 pt-8 md:mt-24 md:pt-10 lg:grid lg:grid-cols-12 lg:gap-x-6"
        >
            <span className="block font-gulfs text-[12px] uppercase tracking-[0.22em] text-white/55 lg:col-span-3">
                More for creators
            </span>

            <ul className="mt-6 grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:col-span-9 lg:col-start-4 lg:mt-0">
                {pages.map((p) => {
                    const active = path === p.href;

                    /*
                     * Every row draws its OWN top hairline rather than the list
                     * carrying `divide-y`: `divide-y` separates children in DOM
                     * order, which in a two-column grid draws a line between
                     * items that are side by side, not stacked.
                     */
                    const row = `flex items-center justify-between gap-4 border-t py-4 ${
                        active ? 'border-[#FF007F]' : 'border-white/[0.14]'
                    }`;

                    if (active) {
                        return (
                            <li key={p.href}>
                                <span aria-current="page" className={`${row} ${LABEL} text-white`}>
                                    {p.label}
                                    <span
                                        aria-hidden="true"
                                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF007F]"
                                    />
                                </span>
                            </li>
                        );
                    }

                    return (
                        <li key={p.href}>
                            <Link
                                href={p.href}
                                className={`group ${row} ${LABEL} text-white/55 hover:border-white/45 hover:text-white`}
                            >
                                {p.label}
                                <span
                                    aria-hidden="true"
                                    className="shrink-0 text-white/0 transition-colors duration-200 group-hover:text-white/70"
                                >
                                    &rarr;
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
