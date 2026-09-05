import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Field from "@/Pages/Auth/register/Field";

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

    // OTP state
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpError, setOtpError] = useState("");
    const [verifying, setVerifying] = useState(false);
    const otpRefs = useRef([]);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({ email: "" });

    // Focus first OTP input on mount
    useEffect(() => {
        if (!editing && !verified) {
            otpRefs.current[0]?.focus();
        }
    }, [editing, verified]);

    // The countdown the resend button reads.
    useEffect(() => {
        if (cooldown <= 0) return undefined;

        const t = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);

        return () => clearInterval(t);
    }, [cooldown]);

    // Background poll for email verification link clicked in another tab/window
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.hidden) return;

            axios
                .get(route("verification.status"))
                .then((resp) => {
                    if (resp.data?.verified) {
                        clearInterval(timer);
                        setVerified(true);
                        setTimeout(() => window.location.reload(), 1200);
                    }
                })
                .catch(() => {});
        }, POLL_MS);

        return () => clearInterval(timer);
    }, []);

    const submitOtp = useCallback(
        (code) => {
            const fullCode = code || otp.join("");
            if (fullCode.length !== 6) {
                setOtpError("Please enter all 6 digits.");
                return;
            }

            setVerifying(true);
            setOtpError("");

            axios
                .post(route("verification.verify-otp"), { otp: fullCode })
                .then((resp) => {
                    if (resp.data?.verified) {
                        setVerified(true);
                        setTimeout(() => {
                            window.location.href =
                                resp.data?.redirect || route("home");
                        }, 1000);
                    }
                })
                .catch((err) => {
                    const msg =
                        err?.response?.data?.message ||
                        err?.response?.data?.errors?.otp?.[0] ||
                        "Verification failed. Please check the code and try again.";
                    setOtpError(msg);
                })
                .finally(() => setVerifying(false));
        },
        [otp],
    );

    const handleOtpChange = (index, val) => {
        setOtpError("");
        const clean = val.replace(/[^0-9]/g, "");

        if (!clean) {
            const next = [...otp];
            next[index] = "";
            setOtp(next);
            return;
        }

        // Pasted or typed multiple digits
        if (clean.length > 1) {
            const digits = clean.slice(0, 6).split("");
            const next = [...otp];
            digits.forEach((d, i) => {
                if (index + i < 6) next[index + i] = d;
            });
            setOtp(next);
            const nextFocus = Math.min(index + digits.length, 5);
            otpRefs.current[nextFocus]?.focus();
            if (next.every((d) => d !== "")) {
                submitOtp(next.join(""));
            }
            return;
        }

        // Single digit
        const next = [...otp];
        next[index] = clean[0];
        setOtp(next);

        if (index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        if (next.every((d) => d !== "")) {
            submitOtp(next.join(""));
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        setOtpError("");
        const text = e.clipboardData
            .getData("text")
            .replace(/[^0-9]/g, "")
            .slice(0, 6);
        if (!text) return;
        const digits = text.split("");
        const next = ["", "", "", "", "", ""];
        digits.forEach((d, i) => {
            next[i] = d;
        });
        setOtp(next);
        const focusIdx = Math.min(digits.length, 5);
        otpRefs.current[focusIdx]?.focus();
        if (digits.length === 6) {
            submitOtp(text);
        }
    };

    const resend = useCallback(() => {
        if (sending || cooldown > 0) return;

        setSending(true);
        setNotice(null);
        setOtpError("");

        axios
            .post(route("verification.email"))
            .then((resp) => {
                const now = Math.floor(Date.now() / 1000);
                setSentAt(resp.data?.last_sent_at || now);
                setCooldown(resp.data?.retry_after || 60);
                setOtp(["", "", "", "", "", ""]);
                otpRefs.current[0]?.focus();
                setNotice({
                    tone: "ok",
                    text: `New 6-digit code sent to ${resp.data?.email || email}.`,
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
                setEmail(data.email.trim().toLowerCase());
                setSentAt(Math.floor(Date.now() / 1000));
                setCooldown(60);
                setEditing(false);
                setOtp(["", "", "", "", "", ""]);
                reset();
            },
        });
    };

    const ago = useMemo(() => sentAgo(sentAt), [sentAt]);

    const resendLabel = sending
        ? "Sending…"
        : cooldown > 0
          ? `Send again in ${cooldown}s`
          : "Send new code";

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
                        Enter verification code
                    </h1>
                    <span
                        aria-hidden="true"
                        className="mt-4 block h-1 w-16 rounded-full bg-[#05EFB8]"
                    />
                    <p className="mt-4 max-w-[34ch] text-sm text-white/70 lg:text-base">
                        We've sent a 6-digit code and a verification link to your email.
                        Enter the code below to verify your account immediately.
                    </p>

                    <dl className="mt-6 max-w-[36ch] space-y-3 border-l-2 border-white/15 pl-4 text-sm">
                        <div>
                            <dt className="font-semibold text-white">
                                Code expires in 15 minutes
                            </dt>
                            <dd className="text-white/60">
                                Need more time? You can request a fresh code whenever you need.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                Check spam and promotions
                            </dt>
                            <dd className="text-white/60">
                                The email arrives from Spenny Piggy. Marking it "not
                                spam" keeps future receipts on track.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-semibold text-white">
                                Wrong address?
                            </dt>
                            <dd className="text-white/60">
                                Change it on this screen — you don't need to register again.
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
                                        <div className="mt-5">
                                            <label className="mb-2.5 block text-xs font-bold uppercase tracking-[0.14em] text-black/70">
                                                Enter 6-digit verification code
                                            </label>
                                            <div className="flex justify-between gap-1.5 sm:gap-2">
                                                {otp.map((digit, i) => (
                                                    <input
                                                        key={i}
                                                        ref={(el) => (otpRefs.current[i] = el)}
                                                        type="text"
                                                        inputMode="numeric"
                                                        autoComplete="one-time-code"
                                                        pattern="[0-9]*"
                                                        maxLength={6}
                                                        value={digit}
                                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                        onPaste={i === 0 ? handleOtpPaste : undefined}
                                                        disabled={verifying || verified}
                                                        className={`h-12 w-11 sm:h-14 sm:w-12 text-center font-gulfs text-xl font-bold rounded-box-sm border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C52FF] ${
                                                            otpError
                                                                ? "border-red-500 bg-red-50 text-red-700"
                                                                : digit
                                                                  ? "border-black bg-[#F5F0FF] text-black"
                                                                  : "border-black/20 bg-white text-black hover:border-black/40"
                                                        }`}
                                                        aria-label={`Digit ${i + 1}`}
                                                    />
                                                ))}
                                            </div>

                                            {otpError && (
                                                <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
                                                    {otpError}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => submitOtp()}
                                                disabled={verifying || otp.join("").length !== 6}
                                                className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-box-sm border-2 border-black bg-[#05EFB8] font-gulfs text-sm uppercase tracking-[0.14em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                                            >
                                                {verifying ? "Verifying…" : "Verify Code"}
                                            </button>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 text-xs">
                                            <span className="text-black/60">Didn't get the code?</span>
                                            <button
                                                type="button"
                                                onClick={resend}
                                                disabled={sending || cooldown > 0}
                                                className="font-bold text-[#8C52FF] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {resendLabel}
                                            </button>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2 text-xs text-black/60">
                                            <span
                                                aria-hidden="true"
                                                className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#8C52FF] motion-reduce:animate-none"
                                            />
                                            <span>
                                                Or click the link in your email — this screen unlocks automatically.
                                            </span>
                                        </div>

                                        <p className="mt-4 text-xs leading-[1.6] text-black/50">
                                            Check spam or promotions if you don't see it within a minute.
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
