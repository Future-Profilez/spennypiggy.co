import { useState } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import VerificationAddressForm from "./VerificationAddressForm";

/**
 * The £500 card-verification gate.
 *
 * 🚨 ONE state, resolved in order — the screen used to compute two independent
 * booleans and could satisfy both at once. `cardVerificationSuccess` sets
 * `profile_status_lock = 1` and `is_subscribed = 1` but never clears
 * `is_500_limit_exceeded`, so after paying, `needsVerification` AND `isPending`
 * were both true: the gifter saw "We're reviewing your details" with the
 * "Activate Account" button still sitting above it, and could pay a second time
 * for nothing. Every state below is exclusive by construction.
 */

const STEPS = [
    { key: "address", label: "Your address" },
    { key: "verify", label: "Verify your card" },
    { key: "review", label: "We check it" },
];

function StepRail({ current }) {
    const index = STEPS.findIndex((s) => s.key === current);

    return (
        <ol className="mb-6 flex items-center gap-2" aria-label="Verification progress">
            {STEPS.map((step, i) => {
                const done = i < index;
                const active = i === index;

                return (
                    <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                            aria-current={active ? "step" : undefined}
                            className={
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-black text-[13px] font-bold " +
                                (done
                                    ? "bg-black text-white"
                                    : active
                                      ? "bg-[#A2E4B8] text-black"
                                      : "bg-white text-black/40")
                            }
                        >
                            {done ? "✓" : i + 1}
                        </span>
                        <span
                            className={
                                "truncate text-[13px] leading-[1.3] " +
                                (active ? "font-semibold text-black" : "text-black/55")
                            }
                        >
                            {step.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

/**
 * ⚠️ Module scope, NOT declared inside `ActivateCard`.
 *
 * A component defined in the parent body is a new type on every render, so React
 * unmounts and remounts the whole subtree — and this one wraps
 * `VerificationAddressForm`, which holds the address the gifter is typing. Every
 * `loading` toggle would have wiped the form. Same trap as `AddItem.jsx`.
 */
function Shell({ children }) {
    return (
        <div className="mx-auto mb-6 rounded-box border-2 border-black bg-white p-4 shadow-[5px_5px_0px_rgba(0,0,0,0.9)] md:p-6">
            {children}
        </div>
    );
}

function Notice({ tone, title, children }) {
    const tones = {
        bad: "border-red-300 bg-red-50 text-red-800",
        warn: "border-orange-300 bg-orange-50 text-orange-800",
    };

    return (
        <div className={`mb-5 rounded-box-sm border-2 p-4 ${tones[tone]}`} role="alert">
            <p className="text-[15px] font-bold">{title}</p>
            <div className="mt-1 text-[14px] leading-[1.5]">{children}</div>
        </div>
    );
}

export default function ActivateCard() {
    const { auth } = usePage().props;
    const user = auth?.user;

    const gate = auth?.verification_gate || null;
    const [address, setAddress] = useState(gate?.address || null);
    const charge = gate?.charge || null;

    const [loading, setLoading] = useState(false);
    const { errorAlert } = useAlerts();

    const hasAddress = !!address?.is_complete;

    const verification = user?.gifter_card_verification;
    const isApproved = user?.profile_status_lock == 2;
    const isRejected =
        user?.profile_reject_reason && user.profile_reject_reason.trim() !== "";
    const isFailed = verification?.status === "failed";

    // ⚠️ `is_subscribed` is what `cardVerificationSuccess` flips, but the verification
    // row's own status is the honest signal — either one means the charge went through.
    const hasPaid =
        verification?.status === "success" || user?.is_subscribed == 1;

    // 🚨 Exclusive, first match wins. A rejection outranks a completed payment because
    // the gifter has to go round again; a completed payment outranks the £500 flag,
    // which is never cleared and would otherwise keep the pay button on screen forever.
    const state = isApproved
        ? null
        : isRejected
          ? "rejected"
          : hasPaid
            ? "pending"
            : user?.is_500_limit_exceeded == 1
              ? "action"
              : null;

    if (!state) return null;

    const startVerification = async () => {
        if (loading) return;
        // The server refuses this with a 422 anyway; stopping here just means the
        // gifter is told what to do instead of watching a request fail.
        if (!hasAddress) {
            errorAlert("Please add your billing address first.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.get(route("gifter.card.verification"));
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                errorAlert("Something went wrong on our side. Please try again.");
            }
        } catch (err) {
            errorAlert(
                err.response?.data?.error ||
                    "We could not reach the server. Check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (state === "pending") {
        return (
            <Shell>
                <StepRail current="review" />
                <h2 className="mb-2 text-center font-GillSans text-[26px] uppercase leading-[1.1] text-black md:text-[30px]">
                    We&apos;re checking your details
                </h2>
                <p className="mx-auto max-w-[420px] text-center text-[15px] leading-[1.55] text-black/75">
                    Your card came back verified. Someone here confirms the last bit,
                    usually within a couple of hours — you&apos;ll get an email the
                    moment it&apos;s done.
                </p>
                <p className="mt-4 text-center text-[14px] font-semibold text-black">
                    Nothing for you to do.
                </p>

                {auth?.verification_status?.address_verification_error ? (
                    <div className="mt-5">
                        <Notice tone="bad" title="We couldn't match your address">
                            {auth.verification_status.address_verification_error}
                        </Notice>
                    </div>
                ) : null}
            </Shell>
        );
    }

    return (
        <Shell>
            <StepRail current={hasAddress ? "verify" : "address"} />

            <h2 className="mb-2 text-center font-GillSans text-[26px] uppercase leading-[1.1] text-black md:text-[30px]">
                {isRejected ? "Let's try that again" : "One quick check"}
            </h2>
            <p className="mx-auto mb-5 max-w-[460px] text-center text-[15px] leading-[1.55] text-black/75">
                You&apos;ve spent over £500 supporting creators. We confirm the card is
                yours once, and then you&apos;re back to buying as normal.
            </p>

            {isRejected ? (
                <Notice tone="bad" title="Your last attempt was rejected">
                    <p>{user.profile_reject_reason}</p>
                    <p className="mt-1.5">
                        Fix the above, check your address below, and try once more.
                    </p>
                </Notice>
            ) : null}

            {isFailed && !isRejected ? (
                <Notice tone="warn" title="Your last payment didn't go through">
                    {verification?.payment_details?.reason ||
                        "The verification payment was cancelled or failed. Nothing was charged."}
                </Notice>
            ) : null}

            <VerificationAddressForm address={address} onSaved={setAddress} />

            <div className="mb-5 rounded-box-sm border-2 border-black bg-[#A2E4B8] p-4">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-black/70">
                    What happens next
                </p>
                <ul className="mt-2 space-y-1.5 text-[15px] leading-[1.5] text-black">
                    {/* 🚨 The real figure, from the same call that creates the charge.
                        This line used to read "a one-time verification fee of £1"
                        while the card was charged the grossed-up £2.95 — three times
                        the promise, on the one payment meant to build trust. */}
                    <li>
                        <span className="font-bold">
                            {charge?.formatted || "A small amount"}
                        </span>{" "}
                        is charged to your card
                    </li>
                    <li>Your bank confirms the card and the address match</li>
                    <li>We check it over and your account is back to normal</li>
                </ul>
            </div>

            <div className="flex flex-col items-center">
                {/* ⚠️ Plain button, not `LoaderButton` — that renders its spinner off
                    `disabled`, so gating the missing address through it left the
                    button spinning before it had ever been pressed. */}
                {/* ⚠️ Not the shared `main-button` class — that is `bg-white`, and this
                    sits on a white card, so the primary action would have been white on
                    white. Black fill matches the address form's own save button, which
                    is the other button in this same flow. */}
                <button
                    type="button"
                    onClick={startVerification}
                    disabled={loading}
                    aria-disabled={!hasAddress}
                    className={
                        "flex min-h-[48px] w-full items-center justify-center rounded-box-sm border-2 border-black bg-black px-6 font-gulfs text-[16px] uppercase text-white sm:w-auto " +
                        (hasAddress ? "" : "opacity-50")
                    }
                >
                    {loading
                        ? "Processing…"
                        : charge?.formatted
                          ? `${isRejected ? "Try again" : "Verify my card"} · ${charge.formatted}`
                          : isRejected
                            ? "Try again"
                            : "Verify my card"}
                </button>
                <p className="mt-2.5 text-center text-[13px] leading-[1.5] text-black/60">
                    Pay with the card registered to the address above — that&apos;s what
                    we check.
                </p>
            </div>
        </Shell>
    );
}
