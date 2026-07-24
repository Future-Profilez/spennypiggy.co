import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

/**
 * A slim "you're not finished setting up" bar for creators who still can't be
 * paid. The full checklist lives on the dashboard, so a creator who wanders off
 * mid-setup had nothing reminding them — this carries the remaining count with
 * them and links straight back.
 *
 * Self-gating: renders nothing for fans, for fully set-up creators, on the
 * dashboard itself (the checklist is already there), or once dismissed.
 */
const DISMISS_KEY = "spenny_onboarding_nudge_dismissed";

export default function OnboardingNudge() {
    const { auth } = usePage().props;
    const currentComponent = usePage().component;
    const [dismissed, setDismissed] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            return sessionStorage.getItem(DISMISS_KEY) === "1";
        } catch {
            return false;
        }
    });

    const u = auth?.user;
    if (!u || u.role != 1) return null;
    if (u.stripe_details_submitted == 1) return null; // fully set up
    if (dismissed) return null;
    // The dashboard already shows the full checklist — don't say it twice.
    if (currentComponent === "Dashboard") return null;

    // Count only what the shared props can see. Socials aren't in the lean auth
    // payload, so this is deliberately an approximation for a nudge — the
    // dashboard checklist remains the source of truth.
    const remaining = [
        u.avatar_approved != 1,
        u.bio_approved != 1,
        !(u.subscription_status === 1 || u.subscription_status === 2),
        u.profile_status_lock != 2,
        u.identity_status != 1,
        u.stripe_details_submitted != 1,
    ].filter(Boolean).length;

    const dismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem(DISMISS_KEY, "1");
        } catch {
            /* private mode — dismiss for this render only */
        }
    };

    return (
        <div className="bg-[#FF007F] text-white">
            <div className="containerbox mx-auto px-4 py-2 flex items-center justify-between gap-3">
                <Link
                    href={route("dashboard")}
                    className="flex items-center gap-2 min-w-0 text-white"
                >
                    <span className="text-base leading-none">🐷</span>
                    <span className="text-sm font-bold truncate">
                        {remaining} step{remaining === 1 ? "" : "s"} left before
                        you can get paid
                    </span>
                    <span className="hidden sm:inline text-sm underline shrink-0">
                        Finish setup
                    </span>
                </Link>
                <button
                    onClick={dismiss}
                    aria-label="Hide setup reminder"
                    className="shrink-0 w-8 h-8 grid place-items-center rounded-full hover:bg-white/20 text-white text-lg leading-none"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
