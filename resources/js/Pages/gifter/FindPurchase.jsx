import React, { useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import GuestLayout from "@/Layouts/GuestLayout";
import Turnstile from "@/Components/Turnstile";

/**
 * "Where did my purchase go?" — for a supporter who never made an account.
 *
 * Guest checkout is allowed on Piggy Pot, Wishes and the Piggy Bank, so someone can pay a
 * creator and hold nothing but a receipt email. Lose that email and there was no route
 * back to the content at all: they cannot sign in, because there is nothing to sign in to.
 *
 * 🚨 The answer is deliberately the same whether or not the address has purchases. This
 * form must never become a way to ask "is this person on Spenny Piggy?" of any address a
 * stranger cares to type — so the confirmation below says "if that email has purchases",
 * never "we found some".
 *
 * ⚠️ Flash toasts come from `FlashMessenger`, which both layouts already mount. A page
 * that adds its own is the duplicate-toast problem that component exists to prevent.
 *
 * ⚠️ NEVER `leading-6` here. This project's tailwind.config maps numeric line-height keys
 * to PIXELS (`leading-6` = 6px, not 1.5rem), so the paragraphs render on top of each
 * other. Use an arbitrary value.
 */
export default function FindPurchase() {
    const { turnstileSiteKey } = usePage().props;

    const { data, setData, post, processing } = useForm({
        email: "",
        cf_turnstile_response: "",
    });

    const [verified, setVerified] = useState(false);
    const [sentTo, setSentTo] = useState(null);
    const turnstileRef = useRef(null);

    // ⚠️ Stable identity. Components/Turnstile lists its callback in a render effect's
    // deps, so a fresh arrow each render removes and re-renders the Cloudflare widget —
    // dozens of times over a session on a page that re-renders as you type.
    const onVerify = useRef((token) => {
        setData("cf_turnstile_response", token);
        setVerified(true);
    }).current;

    const submit = (e) => {
        e.preventDefault();

        // Re-entrancy guard: the disabled re-render loses the double-tap race, and each
        // press sends real mail.
        if (processing) return;

        const attempted = data.email;

        post(route("guest-purchases.send"), {
            preserveScroll: true,
            onSuccess: () => {
                setSentTo(attempted);
                setData("email", "");
                turnstileRef.current?.reset?.();
                setVerified(false);
            },
            onError: () => {
                turnstileRef.current?.reset?.();
                setVerified(false);
            },
        });
    };

    // Mint page, same as the login screen — these two are the same moment for a
    // supporter, and a stranger landing here should not feel sent somewhere else.
    return (
        <GuestLayout className="bg-[#A2E4B8]">
            <Head title="Find my purchase" />

            <div className="flex min-h-[90vh] items-center justify-center px-4 py-3 md:py-12">
                <div className="w-full max-w-[580px]">
                    <div className="rounded-box border-[3px] border-black bg-white p-6 sm:p-8">
                        {sentTo ? (
                            <>
                                <div className="flex h-14 w-14 items-center justify-center rounded-box-sm border-[3px] border-black bg-[#05EFB8]">
                                    <CheckCircle2 size={26} className="text-black" />
                                </div>

                                <h1 className="mt-5 font-gulfs text-[26px] uppercase leading-[1.05] tracking-tight text-black">
                                    Check your inbox
                                </h1>

                                {/*
                                    🚨 "If that email has purchases" — never "we found
                                    them". A confirmation that changes wording based on
                                    whether the address exists is the enumeration this
                                    whole flow is built to avoid.
                                */}
                                <p className="mt-3 text-[15px] leading-[1.55] text-gray-600">
                                    If <span className="font-semibold text-black">{sentTo}</span> has
                                    purchases, we have just sent it a link. It works for
                                    7 days.
                                </p>

                                <p className="mt-3 text-[14px] leading-[1.55] text-gray-500">
                                    Nothing yet? Check your spam folder, then try the
                                    other email you might have used at checkout.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setSentTo(null)}
                                    className="mt-6 min-h-[48px] w-full rounded-box-sm border-[3px] border-black bg-white px-4 text-[15px] font-bold text-black transition-transform hover:-translate-y-0.5"
                                >
                                    Try another email
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex h-14 w-14 items-center justify-center rounded-box-sm border-[3px] border-black bg-pink-100">
                                    <Mail size={24} className="text-[#FF007F]" />
                                </div>

                                <h1 className="mt-5 font-gulfs text-[26px] uppercase leading-[1.05] tracking-tight text-black">
                                    Find my purchase
                                </h1>

                                <p className="mt-3 text-[15px] leading-[1.55] text-gray-600">
                                    Bought something without making an account? Enter the
                                    email you used at checkout and we will send you a link
                                    to everything you have bought.
                                </p>

                                <form onSubmit={submit} className="mt-6">
                                    <label
                                        htmlFor="guest-email"
                                        className="text-[13px] font-bold uppercase tracking-wide text-gray-700"
                                    >
                                        Email address
                                    </label>
                                    <input
                                        id="guest-email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        inputMode="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData("email", e.target.value)
                                        }
                                        placeholder="you@example.com"
                                        className="mt-2 min-h-[52px] w-full rounded-box-sm border-[3px] border-black px-4 text-[15px] text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF007F]"
                                    />

                                    {turnstileSiteKey && (
                                        <div className="mt-4 flex justify-center">
                                            {/* Reads turnstileSiteKey from the shared page
                                                props itself — it takes no siteKey prop. */}
                                            {/* ⚠️ `normal`, not the component's compact
                                                default: compact crops Cloudflare's own
                                                chrome and its lines overlap. */}
                                            <Turnstile
                                                ref={turnstileRef}
                                                size="normal"
                                                onVerify={onVerify}
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            (turnstileSiteKey && !verified)
                                        }
                                        className="mt-5 min-h-[52px] w-full rounded-box-sm border-[3px] border-black bg-[#FF007F] px-4 font-gulfs text-[16px] uppercase text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                                    >
                                        {processing
                                            ? "Processing…"
                                            : "Send me the link"}
                                    </button>
                                </form>

                                <p className="mt-5 flex items-start gap-2 border-t border-gray-200 pt-4 text-[13px] leading-[1.5] text-gray-500">
                                    <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                                    {/*
                                        Stated plainly, because the response is identical
                                        either way and a supporter who genuinely has no
                                        purchases deserves to understand why they were
                                        never told so.
                                    */}
                                    <span>
                                        We only ever send the link to the address itself,
                                        so this page never confirms whether an email has
                                        purchases.
                                    </span>
                                </p>
                            </>
                        )}
                    </div>

                    <p className="mt-5 text-center text-[14px] leading-[1.5] text-gray-800">
                        Have an account?{" "}
                        <Link
                            href={route("login")}
                            className="font-bold text-[#FF007F] underline underline-offset-4"
                        >
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
