import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Field from "@/Pages/Auth/register/Field";

/**
 * The verification screen.
 *
 * 🚨 It no longer sends the email. Registration dispatches the link, and
 * `EmailVerificationPromptController` sends one on arrival if nothing has gone
 * out recently. The old page fired the ONLY send from a mount effect gated by a
 * per-device localStorage timestamp — so a blocked script, a failed request, a
 * closed tab or a second device meant no email was ever sent while this screen
 * announced "Verification Email Sent !!".
 *
 * The design is login's and forgot-password's shell exactly (#0B0B0C, one mint
 * wash, a white bordered panel, the shared Field), because this is the third
 * screen of the same flow. The signature is the ADDRESS: it is set as the hero
 * of the panel with Change beside it, since a typo there is the single reason
 * creators get stuck here and the old page never showed it at all.
 */

const POLL_MS = 10000;

function sentAgo(unixSeconds) {
    if (!unixSeconds) return null;

    const seconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);

    if (seconds < 60) return "just now";
    if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        return `${m} minute${m === 1 ? "" : "s"} ago`;
    }

    const h = Math.floor(seconds / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
}

export default function VerifyEmail({
    verificationEmail,
    lastSentAt = null,
    resendAvailableIn = 0,
}) {
    const { flash = {} } = usePage().props;

    const [email, setEmail] = useState(verificationEmail || "");
    const [sentAt, setSentAt] = useState(lastSentAt);
    const [cooldown, setCooldown] = useState(resendAvailableIn || 0);
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState(null); // {tone: 'ok'|'bad', text}
    const [verified, setVerified] = useState(false);
    const [editing, setEditing] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({ email: "" });

    // The countdown the resend button reads. The server owns the real cooldown;
    // this only says when it is worth pressing again, so a caller is never
    // refused by a 429 they had no way to predict.
    useEffect(() => {
        if (cooldown <= 0) return undefined;

        const t = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);

        return () => clearInterval(t);
    }, [cooldown]);

    // ⚠️ Polls a small JSON endpoint instead of `window.location.reload()`. The
    // old form re-loaded the WHOLE page every 5 seconds for as long as the tab
    // stayed open — the screen could not be read, and every open tab hit the
    // app 12x a minute.
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.hidden) return;

            axios
                .get(route("verification.status"))
                .then((resp) => {
                    if (resp.data?.verified) {
                        clearInterval(timer);
                        setVerified(true);
                        // Let the confirmation land before moving them on.
                        setTimeout(() => window.location.reload(), 1200);
                    }
                })
                .catch(() => {});
        }, POLL_MS);

        return () => clearInterval(timer);
    }, []);

    const resend = useCallback(() => {
        if (sending || cooldown > 0) return;

        setSending(true);
        setNotice(null);

        axios
            .post(route("verification.email"))
            .then((resp) => {
                const now = Math.floor(Date.now() / 1000);
                setSentAt(resp.data?.last_sent_at || now);
                setCooldown(resp.data?.retry_after || 60);
                setNotice({
                    tone: "ok",
                    text: `New link sent to ${resp.data?.email || email}.`,
                });
            })
            .catch((err) => {
                const wait = err?.response?.data?.retry_after;

                if (wait) setCooldown(wait);

                setNotice({
                    tone: "bad",
                    text:
                        err?.response?.status === 429
                            ? "We have just sent one. Give it a moment before asking for another."
                            : "We could not send it. Try again in a moment.",
                });
            })
            .finally(() => setSending(false));
    }, [sending, cooldown, email]);

    const startEditing = () => {
        clearErrors();
        setNotice(null);
        setData("email", email);
        setEditing(true);
    };

    const cancelEditing = () => {
        reset();
        clearErrors();
        setEditing(false);
    };

    const submitEmail = (e) => {
        e.preventDefault();

        if (processing) return;

        post(route("verification.change-email"), {
            preserveScroll: true,
            onSuccess: () => {
                // The server redirects back with the new address in `flash`.
                setEmail(data.email.trim().toLowerCase());
                setSentAt(Math.floor(Date.now() / 1000));
                setCooldown(60);
                setEditing(false);
                reset();
            },
        });
    };

    const ago = useMemo(() => sentAgo(sentAt), [sentAt]);

    const resendLabel = sending
        ? "Sending…"
        : cooldown > 0
          ? `Send again in ${cooldown}s`
          : "Send the link again";

    return (
        <div className="relative flex min-h-[85dvh] flex-col justify-center overflow-hidden bg-[#0B0B0C] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-6 sm:pt-12 lg:py-16">
            <Head title="Confirm your email" />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                    background:
                        "radial-gradient(55% 55% at 50% 38%, #05EFB8 0%, transparent 70%)",
                }}
            />

            {/* Same grid and same single DOM order as login and forgot-password. */}
            <div className="relative mx-auto grid w-full max-w-[440px] gap-6 lg:max-w-[980px] lg:grid-cols-[minmax(0,1fr)_440px] lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-6">
                <header className="lg:col-start-1 lg:row-start-1 lg:self-start">
                    <h1 className="font-gulfs text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[52px] lg:leading-[0.95]">
                        One link and you're in
                    </h1>
                    <span
                        aria-hidden="true"
                        className="mt-4 block h-1 w-16 rounded-full bg-[#05EFB8]"
                    />
                    <p className="mt-4 max-w-[34ch] text-sm text-white/70 lg:text-base">
                        We've sent a link to the address on your account. Open
                        it and this page lets you straight through — no code to
                        type.
                    </p>

                    <dl className="mt-6 max-w-[36ch] space-y-3 border-l-2 border-white/15 pl-4 text-sm">
                        <div>
                            <dt className="font-semibold text-white">
                                Check spam and promotions
                            </dt>
                            <dd className="text-white/60">
                                It arrives from Spenny Piggy. Marking it "not
                                spam" keeps the rest of your mail on track.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                The link lasts 7 days
                            </dt>
                            <dd className="text-white/60">
                                Past that, come back here and send a fresh one.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                Wrong address?
                            </dt>
                            <dd className="text-white/60">
                                Change it below — you don't need to start again.
                            </dd>
                        </div>
                    </dl>
                </header>

                <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start">
                    {(flash.success || notice?.tone === "ok") && (
                        <p className="mb-4 rounded-box-sm border-2 border-[#05EFB8]/40 bg-[#05EFB8]/10 px-4 py-3 text-sm font-medium text-[#05EFB8]">
                            {flash.success || notice.text}
                        </p>
                    )}

                    {(flash.error || notice?.tone === "bad") && (
                        <p
                            role="alert"
                            className="mb-4 rounded-box-sm border-2 border-[#FF3B30]/40 bg-[#FF3B30]/10 px-4 py-3 text-sm font-medium text-[#FF9A94]"
                        >
                            {flash.error || notice.text}
                        </p>
                    )}

                    <div className="rounded-box border-black bg-white p-4 sm:p-6">
                        {verified ? (
                            /*
                                The poll found the address verified. Confirm it
                                where they are looking rather than reloading out
                                from under them.
                            */
                            <div className="py-6 text-center">
                                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#05EFB8] text-black">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-7 w-7"
                                        aria-hidden="true"
                                    >
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </span>
                                <h2 className="mt-4 font-gulfs text-xl uppercase leading-[1.15] text-black">
                                    Email confirmed
                                </h2>
                                <p className="mt-2 text-sm text-black/70">
                                    Taking you to your account…
                                </p>
                            </div>
                        ) : (
                            <>
                                {/*
                                    The signature: the address IS the hero. A typo
                                    here is the single reason people get stuck on
                                    this screen, and the old page never printed it,
                                    so nobody could see what was wrong.
                                */}
                                {editing ? (
                                    <form onSubmit={submitEmail} noValidate>
                                        <Field
                                            id="verification-email"
                                            label="Your email address"
                                            type="email"
                                            inputMode="email"
                                            autoComplete="email"
                                            autoFocus
                                            value={data.email}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                            error={errors.email}
                                            status={
                                                errors.email ? "error" : "idle"
                                            }
                                            hint="We'll send a new link here straight away."
                                        />

                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row-reverse">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="flex min-h-[52px] flex-1 items-center justify-center rounded-box-sm border-black bg-[#05EFB8] font-gulfs text-sm uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                                            >
                                                {processing
                                                    ? "Saving…"
                                                    : "Save and resend"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                className="flex min-h-[52px] flex-1 items-center justify-center rounded-box-sm border-black bg-white text-sm font-bold text-black transition-colors duration-200 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="rounded-box-sm border-2 border-black bg-[#05EFB8] p-4">
                                        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/70">
                                            Sent to
                                        </p>
                                        <p className="mt-1 break-all text-lg font-bold leading-[1.3] text-black">
                                            {email}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={startEditing}
                                            className="mt-3 inline-flex min-h-[44px] items-center rounded-box-sm border-2 border-black bg-white px-4 text-sm font-bold text-black transition-colors duration-200 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                                        >
                                            Not your address? Change it
                                        </button>
                                    </div>
                                )}

                                {!editing && (
                                    <>
                                        <div className="mt-5 flex items-center gap-2 text-sm text-black/70">
                                            <span
                                                aria-hidden="true"
                                                className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#8C52FF] motion-reduce:animate-none"
                                            />
                                            <span>
                                                Waiting for you to open it
                                                {ago ? ` — sent ${ago}` : ""}.
                                                This page unlocks itself.
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={resend}
                                            disabled={sending || cooldown > 0}
                                            className="mt-5 flex min-h-[56px] w-full items-center justify-center rounded-box-sm border-black bg-[#FF007F] font-gulfs text-base uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                                        >
                                            {resendLabel}
                                        </button>

                                        <p className="mt-4 text-xs leading-[1.6] text-black/60">
                                            Nothing after a few minutes? Search
                                            your inbox for "Spenny Piggy" and
                                            check spam — mail clients file a
                                            first message from a new sender
                                            there more often than not.
                                        </p>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {!verified && (
                        <p className="mt-5 text-center text-sm text-white/60">
                            Signed in as the wrong account?{" "}
                            {/*
                                ⚠️ An inline text link inside a sentence cannot
                                simply be given `min-h-[44px]` without breaking
                                the line it sits in. The house idiom is an
                                invisible `before:` that expands the TARGET
                                while the type stays where it is — measured at
                                390px this was a 20px target against the 44px
                                touch floor.
                            */}
                            <Link
                                method="post"
                                href={route("logout")}
                                as="button"
                                className="relative inline-block font-semibold text-[#05EFB8] underline-offset-4 transition-opacity duration-200 before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:opacity-70"
                            >
                                Sign out
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
