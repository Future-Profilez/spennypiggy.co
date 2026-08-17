import { Link, usePage } from '@inertiajs/react';

/**
 * Moving between the six creator guides.
 *
 * ⚠️ Rendered on the DARK field, so this is a quiet outlined row rather than the
 * cream card with black-bordered pills it used to be. That card was the loudest
 * block at the foot of every page, which put the most weight on the least
 * important thing on it — a nav row, sitting directly under the call to action.
 *
 * 🚨 THE ACTIVE TEST COMPARES PATHNAMES, NEVER `startsWith`. Every one of these
 * hrefs begins with `/creators`, so `url.startsWith(p.href)` marked the Overview
 * pill active on all six pages — two pills lit at once, on every page, saying
 * the reader was in two places. `usePage().url` also carries the query string,
 * so the comparison has to be made against the path alone.
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
  ];

    const path = (url || '').split('?')[0].replace(/\/$/, '') || '/creators';

  return (
        <nav aria-label="Creator guides" className="mt-16 md:mt-24">
            <span className="block font-gulfs text-[12px] uppercase tracking-[0.22em] text-white/60">
                More for creators
            </span>

            <div className="mt-5 flex flex-wrap gap-2.5">
          {pages.map((p) => {
                    const active = path === p.href;

            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={active ? 'page' : undefined}
                            className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 font-gulfs text-[12px] uppercase tracking-[0.16em] transition-colors ${
                                active
                                    ? 'border-[#FF007F] bg-[#FF007F] text-black'
                                    : 'border-white/20 text-white/70 hover:border-white/60 hover:text-white'
                            }`}
              >
                            {p.label}
              </Link>
            );
          })}
        </div>
        </nav>
  );
}
