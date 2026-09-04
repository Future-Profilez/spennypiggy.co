import { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import ShareButton from "@/Components/ShareButton";

/**
 * The creator's single "what do I do next" card.
 *
 * Everything it shows — the wording, the destination, the position in the journey — comes
 * from the server's `auth.journey` payload, which is the same payload the nudge bar and the
 * onboarding email read. Nothing about the steps is decided here, so this card cannot tell a
 * creator something a different surface contradicts.
 *
 * Replaces FirstListingCard, which only knew about one step of six.
 */

/** Dismissal is per STEP, not per card: hiding one step must not hide the next. */
const dismissKey = (step) => `spenny_journey_dismissed_v1:${step}`;

/**
 * ⚠️ Dismissing hides the step for a WEEK, not forever.
 *
 * Six steps each with a permanent hide is six chances for a creator to bury the one thing
 * blocking them — most often the listing step — and never be shown it again on that device.
 * "Not now" is what they mean when they close it; "never tell me again" is not.
 */
const DISMISS_DAYS = 7;

const isDismissed = (step) => {
    try {
        const at = Number(localStorage.getItem(dismissKey(step)));
        if (!at) return false;

        return Date.now() - at < DISMISS_DAYS * 86400000;
    } catch {
        return false;
    }
};

export default function CreatorJourneyCard() {
    const { auth } = usePage().props;
    const journey = auth?.journey ?? null;
    const step = journey?.key ?? null;

    // Starts hidden and is revealed by the effect, so a dismissed card never flashes on
    // screen before localStorage has been read.
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        if (!step) return;
        setDismissed(isDismissed(step));
    }, [step]);

    if (!journey || dismissed) return null;

    const waiting = journey.awaiting_review === true;

    const dismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(dismissKey(step), String(Date.now()));
        } catch {
            /* private browsing — hidden for this render only */
        }
    };

    const go = (name, params) => router.visit(route(name, params));

    const profileUrl = auth?.user?.username
        ? route("user.show", auth.user.username)
        : null;

    return (
        <div
            className={`relative mb-6 w-full overflow-hidden rounded-box border-[3px] border-black p-5 md:p-6 ${
                waiting ? "bg-white" : "bg-[#FFF6EC]"
            }`}
        >
            <button
                onClick={dismiss}
                aria-label="Hide this step"
                className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white text-xl font-black transition-colors hover:bg-[#FF007F] hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50"
            >
                ×
            </button>

            <div className="mb-5 max-w-[550px]">
                {/* Position is what turns a nag into progress: it says there is an end. */}
                <div
                    className={`mb-3 inline-block -rotate-1 rounded-box-sm border-[3px] border-black px-4 py-1.5 ${
                        waiting
                            ? "bg-white"
                            : "bg-gradient-to-r from-[#FF007F] to-[#FF8E25]"
                    }`}
                >
                    <h3
                        className={`m-0 text-sm font-black uppercase tracking-wide md:text-base ${
                            waiting ? "text-black" : "text-white"
                        }`}
                    >
                        {waiting
                            ? "⏳ With us"
                            : `Step ${journey.position} of ${journey.total}`}
                    </h3>
                </div>

                <h2 className="mb-2 text-xl font-black leading-tight text-black md:text-2xl">
                    {journey.title}
                </h2>
                <p className="text-xs font-bold leading-snug text-neutral-600 md:text-sm">
                    {journey.body}
                </p>
            </div>

            {/* Nothing to click while the work is ours — offering a button here would be
                asking them to redo what they have already submitted. A "waiting" step may
                still carry a route; the server decides that, not this card. ⚠️ An ID check
                the creator opened and walked away from is no longer one of them — it is not
                "waiting" at all now, it is their own step with a "Finish ID check" CTA
                (CreatorJourneyService::UNFINISHED_COPY). */}
            {waiting && !journey.route ? null : step === "first_listing" ? (
                <ThreeWays onPick={go} />
            ) : step === "first_sale" && profileUrl ? (
                <ShareButton
                    label={journey.cta}
                    share={{
                        title: "My Spenny Piggy page",
                        caption: "My page is live — come and take a look.",
                        url: profileUrl,
                    }}
                />
            ) : journey.route ? (
                <button
                    onClick={() => go(journey.route, journey.params)}
                    className="inline-flex min-h-[44px] items-center rounded-box-sm border-[3px] border-black bg-white px-5 py-2.5 text-sm font-black uppercase tracking-wider transition-colors duration-200 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 motion-reduce:transition-none"
                >
                    {journey.cta}
                </button>
            ) : null}
        </div>
    );
}

/**
 * The listing step is the one place a single button is the wrong answer: what a creator
 * sells decides which form they need, and picking for them is how they end up abandoning a
 * form that did not fit.
 */
function ThreeWays({ onPick }) {
    const options = [
        {
            emoji: "📁",
            title: "Sell a file",
            body: "A photo set, audio track, PDF, or video. Fastest to set up.",
            recommended: true,
            // `?add=digital` / `?add=physical` are the intents `Dashboard.jsx` reads once on
            // render and hands to AddItem, which opens the matching form. `shop?type=add` used
            // to land here — ShopPage maps `add` to the PRODUCTS LIST tab, so both buttons
            // delivered a list with no form, and both went to the same place.
            go: () => onPick("dashboard", { add: "digital" }),
        },
        {
            emoji: "📝",
            title: "Take an order",
            body: "Custom video, shoutout, or service. Fan pays first, you deliver.",
            go: () => onPick("task.create"),
        },
        {
            emoji: "📦",
            title: "Sell physical",
            body: "A print, merch, or physical goods. We collect shipping details.",
            go: () => onPick("dashboard", { add: "physical" }),
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {options.map((option) => (
                <button
                    key={option.title}
                    onClick={option.go}
                    className="group relative flex flex-col rounded-box-sm border-[3px] border-black bg-white p-4 text-left transition-colors duration-200 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/50 motion-reduce:transition-none"
                >
                    {option.recommended && (
                        <span className="absolute -top-2.5 right-3 rounded-full border-2 border-black bg-[#FF007F] px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-black ">
                            Recommended
                        </span>
                    )}
                    <div aria-hidden="true" className="mb-2.5 text-3xl">
                        {option.emoji}
                    </div>
                    <h4 className="mb-1 text-sm font-black uppercase tracking-wider text-black transition-colors group-hover:text-[#FF007F]">
                        {option.title}
                    </h4>
                    <p className="text-xs font-bold leading-normal text-neutral-600">
                        {option.body}
                    </p>
                </button>
            ))}
        </div>
    );
}
