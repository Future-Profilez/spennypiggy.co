import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";

/**
 * "Start selling from this account" — on the gifter's OWN profile.
 *
 * 🚨 MOUNTED BEHIND `IsloggedIn && !isCreatorProfile`, and BOTH halves are
 * load-bearing. `/{username}` is the public profile as well as the owner's own
 * page, so without the owner gate every visitor to a fan's profile is invited to
 * convert somebody else's account; without the role gate a creator is offered a
 * conversion they have already made.
 *
 * 🚨 IT LINKS TO THE PAGE, NEVER AT THE WRITE. The conversion is a POST to
 * `become.creator.store` — a GET that flips a role and re-opens a profile for
 * review needs nothing to click it (a link prefetch, a hover prerender, an inbox
 * scanning a link), which is exactly the fault `NoWritingGetRoutesTest` exists
 * for. This card renders on every load of the owner's own profile, so it is the
 * single worst place in the app to render a writing URL.
 *
 * ⚠️ A literal path, not `route()`. `resources/js/ziggy.js` is a generated
 * snapshot and `route()` THROWS for a name it does not carry until
 * `ziggy:generate` has run — which would take the whole profile down to render
 * one card.
 *
 * Design: house frame (`border-black` ALONE — it is a full 2px shorthand in this
 * project, so a width class beside it is discarded), radius tokens, no shadow,
 * and BLACK type on the brand pink (white on `#FF007F` is 3.78:1 and fails AA;
 * black is 5.56:1).
 */
export default function BecomeCreatorCard({ className = "" }) {
    return (
        <Link
            href="/become-creator"
            className={`group flex items-center justify-between gap-4 rounded-box border-black bg-[#FF007F] p-4 transition-[filter] duration-200 hover:brightness-105 sm:p-5 ${className}`}
        >
            <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-black/65">
                    Your account
                </p>
                <h2 className="mt-1 font-gulfs text-lg uppercase leading-[1.1] text-black sm:text-xl">
                    Start selling from this account
                </h2>
                <p className="mt-1.5 text-sm leading-[1.5] text-black/75">
                    Turn this into a creator account and sell content,
                    memberships and requests. You keep every purchase and
                    subscription you already have.
                </p>
            </div>

            {/* Decorative — the whole card is the control, so this must not be a
                second focusable element inside it. */}
            <span
                aria-hidden="true"
                className="hidden shrink-0 items-center gap-1 rounded-box-sm border-black bg-white px-4 py-2.5 text-sm font-bold text-black sm:inline-flex"
            >
                Get started
                <ChevronRight size={16} />
            </span>

            <ChevronRight
                size={22}
                aria-hidden="true"
                className="shrink-0 text-black/70 sm:hidden"
            />
        </Link>
    );
}
