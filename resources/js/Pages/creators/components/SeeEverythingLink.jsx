import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

/**
 * Top-of-page link out to the main landing page.
 *
 * Every `/creators/*` page is a paid-ads destination, so a visitor lands here
 * from a search result having seen one claim and nothing else. Without a way
 * back into the site the only two things they can do are sign up or leave.
 *
 * ⚠️ It points at the MAIN landing page (`/`), not at `/creators/features` —
 * the ad traffic is cold, and the home page is the one that shows the platform
 * rather than one argument about it. `CreatorGuideLinks` at the foot of each
 * page covers moving between the creator guides.
 *
 * ⚠️ Rendered on a DARK field, so it is a hairline outline rather than the
 * white-on-black pill it was: a solid white block here reads as a primary
 * action, and the primary action on these pages is the pink CTA.
 */
export default function SeeEverythingLink({ className = '' }) {
    return (
        <div className={`flex ${className}`}>
            <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 min-h-[44px] font-gulfs text-[12px] uppercase tracking-[0.18em] text-white/80 transition-colors hover:border-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
                <span>Check out all our features</span>
                <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                />
            </Link>
        </div>
    );
}
