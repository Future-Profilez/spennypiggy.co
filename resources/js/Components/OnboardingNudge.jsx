import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";

/**
 * A slim bar carrying whatever the creator's current journey step is.
 *
 * ⚠️ It derives NOTHING itself. It used to read `stripe_details_submitted`,
 * `avatar_approved`, `identity_status` and friends and count "steps left" from them — a
 * second implementation of the journey that could, and did, disagree with the dashboard
 * card. Everything here now comes from `auth.journey`, the same payload the card and the
 * onboarding email render, so the three cannot contradict each other.
 *
 * Self-gating: nothing for fans, nothing once the journey is finished, nothing on the
 * dashboard (the card is already there and saying the same thing), nothing once dismissed.
 */
const dismissKey = (step) => `spenny_journey_bar_dismissed:${step}`;

export default function OnboardingNudge() {
    const { auth } = usePage().props;
    const currentComponent = usePage().component;

    const journey = auth?.journey ?? null;
    const step = journey?.key ?? null;

    const [dismissed, setDismissed] = useState(() => {
        if (typeof window === "undefined" || !step) return false;
        try {
            return sessionStorage.getItem(dismissKey(step)) === "1";
        } catch {
            return false;
        }
    });

    // The dashboard card already occupies this creator's attention with the same message.
    if (!journey || dismissed || currentComponent === "Dashboard") return null;

    const dismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem(dismissKey(step), "1");
        } catch {
            /* private mode — dismissed for this render only */
        }
    };

    // While the work is with an admin there is nowhere to send them, so the bar states the
    // position and offers no action. Asking for a click here would be asking them to redo
    // something they have already submitted.
    // ⚠️ Unless the server sent a route with the waiting copy — an ID check the creator
    // may have abandoned still needs a way back in, and the server decides that.
    const waiting = journey.awaiting_review === true;
    const href = journey.route
        ? route(journey.route, journey.params ?? {})
        : waiting
          ? null
          : route("dashboard");

    /*
     * 🚨 THIS BAR WAS THE WORST OF THE THREE CTAs (7 Sep 2026).
     *
     * `update.profile.lock.status` was a GET, and this component rendered it as a plain
     * <a href> at the top of EVERY page for a creator on the `review` step — so a browser
     * link-preload, a hover prerender or an extension link scanner submitted the profile
     * for them, from anywhere on the site. It is a POST now, and `as="button"` means
     * there is no fetchable href left on the element at all.
     *
     * The verb comes from the server (`CreatorJourneyService::methodFor()`, read off the
     * route itself) so it cannot drift from the route or from the other two CTAs.
     */
    const isPost = journey.method === "post" && Boolean(journey.route);

    const Body = (
        <span className="flex min-w-0 items-center gap-2 text-white">
            <span className="text-base leading-none">🐷</span>
            <span className="truncate text-sm font-bold">{journey.title}</span>
            {journey.cta && (!waiting || journey.route) && (
                <span className="hidden shrink-0 text-sm underline sm:inline">
                    {journey.cta}
                </span>
            )}
        </span>
    );

    return (
        <div
            className={
                waiting
                    ? "bg-neutral-800 text-white"
                    : "bg-green-500 text-white"
            }
        >
            <div className="containerbox mx-auto flex items-center justify-between gap-3 px-4 py-2">
                {href ? (
                    <Link
                        href={href}
                        method={isPost ? "post" : "get"}
                        as={isPost ? "button" : "a"}
                        className={isPost ? "min-w-0 text-left" : undefined}
                    >
                        {Body}
                    </Link>
                ) : (
                    Body
                )}
                <button
                    onClick={dismiss}
                    aria-label="Hide this reminder"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg leading-none text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
