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
    const waiting = journey.awaiting_review === true;
    const href = waiting
        ? null
        : journey.route
            ? route(journey.route, journey.params ?? {})
            : route("dashboard");

    const Body = (
        <span className="flex min-w-0 items-center gap-2 text-white">
            <span className="text-base leading-none">🐷</span>
            <span className="truncate text-sm font-bold">{journey.title}</span>
            {! waiting && (
                <span className="hidden shrink-0 text-sm underline sm:inline">
                    {journey.cta}
                </span>
            )}
        </span>
    );

    return (
        <div className={waiting ? "bg-neutral-800 text-white" : "bg-green-500 text-white"}>
            <div className="containerbox mx-auto flex items-center justify-between gap-3 px-4 py-2">
                {href ? <Link href={href}>{Body}</Link> : Body}
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
