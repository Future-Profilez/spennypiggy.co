import { useCallback, useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import Popup from "@/Components/Popup";

/**
 * "Tell your supporters" — the creator's own push, on their dashboard.
 *
 * 🚨 THIS CARD IS THE WHOLE REASON THE FEATURE PRODUCED NOTHING. The service, the
 * model, the `creator_push_messages` table, the rate limit, the moderation rules and
 * both routes (`creator.push.status`, `creator.push.send`) all shipped and work —
 * and `resources/js` contained **zero references to any of it**. There was no button
 * anywhere in the app, so no creator could send one, and the table sat at 0 rows
 * looking like a feature nobody wanted. Same shape of fault as the bio page before
 * `BioLinkCard`, and as `SaveButton`'s dead `is_saved` prop.
 *
 * ⚠️ EVERY RULE IS THE SERVER'S. The counter and the disabled states here are a
 * courtesy so a creator is not told "no" after typing; `CreatorPushService` re-checks
 * length, links, @handles, phone numbers, e-mail addresses, the blocked-word list and
 * the allowance on submit. Never treat the client copy as the gate — and never relax
 * it either, or the creator writes 160 characters to be refused at the end of it.
 *
 * ⚠️ NO SUCCESS TOAST HERE. `send()` answers with `back()->with('success', …)` and
 * `BrandToaster` already renders `flash.success` globally; raising our own would show
 * the creator the same sentence twice.
 *
 * ⚠️ THE ARTWORK IS THE THING DRAWN AS ITSELF, not an icon — the lesson written up on
 * `BioLinkCard`. A bell glyph says "notification", which the headline already says. A
 * lock screen with a banner on it says what actually happens: your name, one line of
 * text, on their phone.
 */
export default function CreatorPushCard({ className = "" }) {
    const { errors } = usePage().props;

    const [status, setStatus] = useState(null);
    const [unavailable, setUnavailable] = useState(false);
    const [open, setOpen] = useState(false);
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);

    const loadStatus = useCallback(() => {
        if (!window.axios) return;

        window.axios
            .get(route("creator.push.status"))
            .then((r) => setStatus(r.data))
            .catch((e) => {
                // 403 = not a creator. Anything else is a fault, not a state, and
                // the card simply stays out of the way rather than showing an error
                // on somebody's dashboard.
                if (e?.response?.status === 403) setUnavailable(true);
            });
    }, []);

    useEffect(loadStatus, [loadStatus]);

    if (unavailable || !status) return null;

    const maxLength = status.max_length ?? 160;
    const minLength = 10;
    const typed = body.trim().length;
    const tooShort = typed > 0 && typed < minLength;
    const remaining = maxLength - body.length;

    const canSend = status.allowed && typed >= minLength && body.length <= maxLength && !sending;

    const send = () => {
        if (!canSend) return;

        setSending(true);
        router.post(
            route("creator.push.send"),
            { body },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBody("");
                    setOpen(false);
                    // The allowance has moved; re-read it rather than guessing.
                    loadStatus();
                },
                // A refusal leaves the sheet open with the text intact — the
                // creator has to edit it, and re-typing it would be the fastest
                // way to make them give up.
                onFinish: () => setSending(false),
            },
        );
    };

    const allowanceLine = status.allowed
        ? `${Math.max(0, (status.max_per_day ?? 1) - (status.sent_today ?? 0))} left today · ` +
          `${Math.max(0, (status.max_per_month ?? 4) - (status.sent_this_month ?? 0))} left this month`
        : status.reason;

    return (
        <>
            <div className={`rounded-box border-2 border-[#000] bg-white p-5 md:p-6 ${className}`}>
                <div className="flex items-start gap-4">
                    {/* A lock screen with a notification banner on it. */}
                    <span
                        aria-hidden="true"
                        className="flex h-[84px] w-16 shrink-0 flex-col justify-start gap-1.5 rounded-box-sm border border-[#000] bg-black p-1.5"
                    >
                        <span className="flex items-center gap-1 rounded-[4px] border border-[#000] bg-white p-1">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-[#000] bg-[#FF007F]" />
                            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                                <span className="block h-[2px] w-full rounded-full bg-black/70" />
                                <span className="block h-[2px] w-3/4 rounded-full bg-black/35" />
                            </span>
                        </span>
                        <span className="mt-auto flex flex-col items-center gap-[3px]">
                            <span className="block h-[3px] w-8 rounded-full bg-white/70" />
                            <span className="block h-[3px] w-5 rounded-full bg-white/40" />
                        </span>
                    </span>

                    <div className="min-w-0 flex-1">
                        <div className="text-[18px] font-black uppercase text-black md:text-[22px]">
                            Tell your supporters
                        </div>
                        <div className="mt-0.5 text-[13px] font-semibold text-gray-600 md:text-[15px]">
                            One notification to everyone who has bought from you. It opens your page.
                        </div>

                        <div
                            className={`mt-2 text-[12px] font-bold md:text-[13px] ${
                                status.allowed ? "text-black/60" : "text-black/50"
                            }`}
                        >
                            {allowanceLine}
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            disabled={!status.allowed}
                            className="mt-3 rounded-box-sm border-2 border-black bg-[#FF007F] px-4 py-2 text-[13px] font-black uppercase tracking-wide text-black transition-colors duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:bg-black/[0.06] disabled:text-black/40 md:text-[14px]"
                        >
                            Write a notification
                        </button>
                    </div>
                </div>
            </div>

            {/* ⚠️ NO `text` PROP. Popup renders `text` as its own TRIGGER BUTTON, not as
                a title — passing one here would put a second, unstyled button on the
                dashboard beside the card's own. This panel is controlled by `action`, and
                the heading is drawn in the body below the sheet's pink header band. */}
            <Popup action={open} onHide={() => setOpen(false)} size="lg">
                <div className="px-1 pb-1">
                    <h2 className="text-[20px] font-black uppercase tracking-tight text-black md:text-[24px]">
                        Tell your supporters
                    </h2>
                    <p className="mt-1 text-[13px] font-semibold text-gray-600">
                        This goes to everyone who has bought from you and has notifications
                        switched on. Tapping it opens your page.
                    </p>

                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value.slice(0, maxLength))}
                        maxLength={maxLength}
                        rows={4}
                        autoFocus
                        placeholder="Something new is up on my page…"
                        aria-label="Notification text"
                        className="mt-3 w-full rounded-box-sm border-2 border-black bg-white p-3 text-[15px] font-semibold text-black placeholder:text-black/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F]/40"
                    />

                    <div className="mt-1.5 flex items-center justify-between gap-3 text-[12px] font-bold">
                        <span className={tooShort ? "text-red-600" : "text-black/50"}>
                            {tooShort ? `At least ${minLength} characters.` : "Keep it short — it has to fit on a lock screen."}
                        </span>
                        <span className={remaining <= 20 ? "text-[#FF007F]" : "text-black/50"}>
                            {remaining}
                        </span>
                    </div>

                    {/* The server's refusal, verbatim — it names what to remove. */}
                    {errors?.body && (
                        <p className="mt-2 rounded-box-sm border-2 border-black bg-red-100 px-3 py-2 text-[13px] font-bold text-black">
                            {errors.body}
                        </p>
                    )}

                    <p className="mt-3 text-[12px] font-semibold text-black/50">
                        No links, usernames, phone numbers or email addresses — everything your
                        supporters need is already on your page.
                    </p>

                    <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-box-sm border-2 border-black bg-white px-4 py-2 text-[13px] font-black uppercase tracking-wide text-black transition-colors duration-200 hover:bg-[#F4F4F5]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={send}
                            disabled={!canSend}
                            className="rounded-box-sm border-2 border-black bg-[#FF007F] px-4 py-2 text-[13px] font-black uppercase tracking-wide text-black transition-colors duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:bg-black/[0.06] disabled:text-black/40"
                        >
                            {sending ? "Sending…" : "Send"}
                        </button>
                    </div>
                </div>
            </Popup>
        </>
    );
}
