import { useAlerts } from "@/Components/Alerts";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Countries from "@/includes/Countries";
import { useForm, Head } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { useRef } from "react";

// ── Journey rail ────────────────────────────────────────────────────────────
// The gates a creator crosses to get paid are a real ordered sequence, so
// numbering carries information (where you are, what's left). Completed segments
// fill mint — the piggy filling up — which is the one signature note on the page.
//
// ⚠️ The steps come from the SERVER (`journey_steps`, built by
// CreatorJourneyService::stepStates). This file used to hold its own array, and
// it still listed identity before connect after that order was reversed on
// 31 July 2026 — so the rail said "Identity verified — you're here" while the
// panel beneath it said "Connect your payments". Never hardcode the order here.
function StepNode({ index, done, current }) {
    const base =
        "relative z-10 grid place-items-center w-9 h-9 shrink-0 rounded-full border-2 border-black font-gulfs text-sm transition-colors";
    if (done) return <span className={`${base} bg-mint text-black`}>✓</span>;
    if (current)
        return (
            <span
 className={`${base} bg-[#FF007F] text-black ring-4 ring-pink-100 motion-safe:animate-pulse`}
            >
                {index + 1}
            </span>
        );
 return <span className={`${base} bg-white text-black/60`}>{index + 1}</span>;
}

function JourneyRail({ steps, activeIndex }) {
    return (
        <ol className="relative mb-8" aria-label="Setup progress">
            {steps.map((s, i) => {
                const current = i === activeIndex;
                const last = i === steps.length - 1;
                // "With us" is not "your turn" — a step the creator has finished
                // and an admin has not yet approved must not read as a task.
                const status = s.done
                    ? "Done"
                    : s.awaiting_review
                      ? "With us"
                      : current
                        ? "You’re here"
                        : "Next";
                return (
                    <li key={s.key} className="relative flex gap-4 pb-5 last:pb-0">
                        {!last && (
                            <span
                                aria-hidden
                                className={`absolute left-[17px] top-9 -bottom-0.5 w-0.5 ${
                                    s.done ? "bg-mint" : "bg-gray-200"
                                }`}
                            />
                        )}
                        <StepNode index={i} done={s.done} current={current} />
                        <div className="pt-1">
                            <p
                                className={`font-CeraGR font-bold leading-tight ${
                                    current
                                        ? "text-black"
                                        : s.done
 ? "text-black/80"
 : "text-black/60"
                                }`}
                            >
                                {s.label}
                            </p>
                            <span
 className={`inline-block mt-1 text-[12px] font-bold uppercase tracking-widest ${
                                    s.done
                                        ? "text-[#3aa76d]"
                                        : current
                                          ? "text-[#FF007F]"
 : "text-black/60"
                                }`}
                            >
                                {status}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

const Spinner = ({ label }) => (
    <span className="flex items-center justify-center">
        <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
        {label}
    </span>
);

export default function Stripe(props) {
    const {
        auth,
        user,
        success,
        mor_consent_given,
        mor_consent_details,
        has_account,
        account_country,
        journey_steps,
    } = props;
    const checkRef = useRef();
    const creatorEmailReceiptAckRef = useRef();
    const { errorAlert, successAlert } = useAlerts();
    const { data, setData, post, processing, errors } = useForm({
        termaccept: "",
        mor_agreed: false,
        creator_email_receipt_ack: false,
    });

    const acknowledgements = [
        "I am the seller of my content, services, and any Creator Content made available through my profile or storefront.",
        "All payments made by supporters are made directly to me via my connected Stripe account, and I am solely responsible for the fulfilment, delivery, and quality of all Creator Content.",
        "I am responsible for handling refunds, disputes, chargebacks, complaints, and any claims arising from transactions with supporters, subject to the Platform’s rights and payment processor requirements.",
        "I am responsible for determining, reporting, and paying any applicable taxes in my jurisdiction, including income tax, VAT, sales tax, or any other applicable taxes.",
        "Spenny Piggy provides payment routing, processing infrastructure, moderation systems, and risk management controls only, and does not act as the seller, merchant, or supplier of any goods or services.",
        "Spenny Piggy may, at its sole discretion, intervene in transactions, including delaying payouts, applying reserves, withholding funds, reversing transactions, or issuing refunds where required for compliance, fraud prevention, dispute resolution, or risk management purposes.",
        "All funds are subject to processing, verification, and risk controls and are not guaranteed until successfully paid out in accordance with Platform policies and payment processor requirements.",
        "I agree to comply with all Platform Terms, Payment Processor requirements (including Stripe), and applicable laws in connection with my use of the Platform.",
    ];

    // Keep your profile content-only — shown before connect so nothing on the
    // account trips Stripe's review. Reframed off gift/tip/tribute wording.
    const contentRules = [
        "Physical goods or shipped items — sell content, not parcels",
        "Off-platform promises — content must be delivered here",
        "Nudity in listing thumbnails — keep item images SFW",
        "Alcohol, tobacco or THC items",
        "Explicit adult toys (sensual wellness products are fine)",
        "Service words: tax, fee, session, deposit, unblock",
        "Donation or tribute wording — describe the content instead",
    ];

    const [countryCurrency, setCountryCurrency] = useState();
    const [country, setCountry] = useState("");
    const [connecting, setConnecting] = useState(false);
    // Terms acceptance must be state, not a ref. Reading checkRef.current inside
    // the button's `disabled` expression never re-renders, and on first paint the
    // ref is still undefined — which left the button enabled with nothing ticked.
    const [termsAccepted, setTermsAccepted] = useState(false);

    const finalStepsUnlocked = auth?.user?.profile_status_lock == 2;
    const creatorEmailReceiptAcked = !!auth?.user
        ?.creator_email_receipt_acknowledged_at;

    // ⚠️ Server-owned. See the JourneyRail comment — the order is a product
    // decision and lives in CreatorJourneyService::STEPS, never here.
    const steps = journey_steps || [];
    const activeIndex = steps.findIndex((s) => !s.done);

    // Where "connect payouts" sits in the rail, so the panel heading can say the
    // real step number instead of a literal that goes stale the moment a step is
    // added — which is exactly how this page came to say "Step 4 of 5" while the
    // rail beside it was pointing at a different row.
    const connectIndex = steps.findIndex((s) => s.key === "stripe");
    const stepLabel =
        connectIndex >= 0
            ? `Step ${connectIndex + 1} of ${steps.length}`
            : "Connect payments";

    // A creator who started onboarding and backed out already HAS an account, and
    // an account's country is fixed at creation — so re-asking for one is a
    // question with no effect. initConnect also skips the terms gate once an
    // account exists, so the whole form collapses to a single resume action.
    const resuming = !!has_account;

    // Show success message if redirected after consent AND scroll to top
    useEffect(() => {
        if (success) {
            successAlert(success);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [success]);

    // Every gate the server also enforces, so the button can never be the only
    // thing standing between an un-consented creator and a Stripe account.
    // Resuming skips the ones the server itself skips for an existing account.
    const canConnect =
        !connecting &&
        finalStepsUnlocked &&
        !!mor_consent_given &&
        (resuming ||
            (!!country &&
                termsAccepted &&
                (creatorEmailReceiptAcked ||
                    !!data.creator_email_receipt_ack)));

    // Only show consent details if consent was given before this session
    const showConsentDetails = mor_consent_details && !success;

    const getCountry = (e) => {
        if (e == "") {
            setCountry("");
        } else {
            const name = JSON.parse(e);
            setCountry((name && name.code) || "");
            setCountryCurrency((name && name.currency) || "");
        }
    };

    const handleMorConsent = () => {
        if (!data.mor_agreed) {
            errorAlert(
                "Please check the confirmation box to agree to the Merchant of Record terms.",
            );
            return;
        }

        post(route("stripe.mor-consent.store"), {
            preserveScroll: true,
            onError: (errs) => {
                if (errs.message) {
                    errorAlert(errs.message);
                } else {
                    errorAlert("Failed to confirm agreement. Please try again.");
                }
            },
        });
    };

    const checkTerms = () => {
        if (!finalStepsUnlocked) {
            errorAlert(
                "Complete admin profile approval before connecting Stripe.",
            );
            return false;
        }
        if (!mor_consent_given) {
            errorAlert("You must agree to the Merchant of Record terms first.");
            return false;
        }
        // An existing account has already passed all of these on its first
        // connect, and the server skips them too — asking again would be asking
        // a creator to re-agree to things they cannot change.
        if (!resuming) {
            if (country == "") {
                errorAlert("Please choose your country.");
                return false;
            }
            if (!creatorEmailReceiptAcked && !data.creator_email_receipt_ack) {
                errorAlert(
                    "Please confirm you understand your creator e-mail address may appear on supporter transaction records and receipts.",
                );
                creatorEmailReceiptAckRef.current?.focus();
                return false;
            }
            if (!termsAccepted) {
                errorAlert("Please accept the terms & conditions to continue.");
                checkRef.current?.focus();
                return false;
            }
        }

        setConnecting(true);

        post(
            route("stripe.connect", {
                country: resuming ? account_country : country,
                currency: countryCurrency,
            }),
            {
                preserveScroll: true,
                onError: (errs) => {
                    Object.keys(errs || {}).forEach((k) => {
                        if (errs[k]) errorAlert(errs[k]);
                    });
                },
                // A server-side redirect carrying a flash error never fires
                // onError, which left the button spinning and disabled forever.
                onFinish: () => setConnecting(false),
            },
        );
        return true;
    };

    const cardCls =
 "bg-white border-2 border-black rounded-box overflow-hidden";

    return (
        <Authenticated auth={auth.user} user={user}>
            <Head
                title={
                    mor_consent_given
                        ? "Connect payments - Spenny Piggy"
                        : "Seller agreement - Spenny Piggy"
                }
            />
            <div className="bg-[#FDF3F8] min-h-dvh py-8 md:py-12 pb-32">
                <div className="max-w-2xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8">
 <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#FF007F] mb-1">
                            Get set up to earn
                        </p>
                        <h1 className="text-[30px] md:text-[38px] leading-none font-gulfs uppercase text-black">
                            Start getting paid
                        </h1>
 <p className="text-black/80 font-CeraGR mt-2">
                            A few quick steps and supporters can pay you for your
                            content. We’ll guide you the whole way.
                        </p>
                    </div>

                    {/* Consent-found note (returning creator) */}
                    {showConsentDetails && (
                        <div className="mb-6 flex items-start gap-3 bg-mint/30 border-2 border-black rounded-box-sm p-4">
                            <span className="text-lg leading-none">🐷</span>
                            <p className="text-sm font-CeraGR text-black">
                                <span className="font-bold">
                                    Seller agreement on file.
                                </span>{" "}
                                Confirmed {mor_consent_details.given_at}
                                {mor_consent_details.location &&
                                    ` from ${mor_consent_details.location}`}
                                .
                            </p>
                        </div>
                    )}

                    {/* Gating banner */}
                    {!finalStepsUnlocked && (
                        <div className="mb-6 bg-yellow-50 border-2 border-black rounded-box-sm p-4">
                            <p className="font-bold font-CeraGR text-black">
                                Profile approval needed first
                            </p>
 <p className="text-sm text-black/80 font-CeraGR mt-0.5">
                                Finish your profile and submit it for admin
                                approval to unlock payment setup.
                            </p>
                        </div>
                    )}

                    {/* The journey */}
                    <JourneyRail steps={steps} activeIndex={activeIndex} />

                    {/* Active step panel */}
                    {!mor_consent_given ? (
                        // ── Step 3: Seller agreement (Merchant of Record) ──
                        <div className={cardCls}>
                            <div className="bg-black text-white px-6 py-4">
 {/* Same step as the connect panel below — the seller
 agreement is the first half of "connect payouts",
 not a step of its own. Derived, never a literal:
 "Step 3 of 5" was hardcoded here and went stale
 the moment the journey gained a step. */}
 <p className="text-[12px] font-bold uppercase tracking-widest text-mint">
 {stepLabel}
                                </p>
                                <h2 className="font-gulfs uppercase text-xl">
                                    Your seller agreement
                                </h2>
                            </div>

                            <div className="p-6">
                                <div className="bg-[#FDF3F8] border-2 border-black rounded-box-sm p-5 mb-6">
                                    <p className="text-[15px] text-black font-CeraGR font-semibold leading-relaxed">
                                        You are the seller. Every payment goes
                                        directly to you through your own Stripe
                                        account, and you’re responsible for
                                        delivering the content you sell —{" "}
                                        <span className="text-[#FF007F]">
                                            Oink, @{auth?.user?.username}!
                                        </span>
                                    </p>
                                </div>

 <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-3">
                                    By continuing you agree that:
                                </p>
                                <ul className="space-y-3 mb-6">
                                    {acknowledgements.map((text, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-3"
                                        >
 <span className="grid place-items-center w-5 h-5 shrink-0 mt-0.5 rounded-full bg-mint text-black text-[12px] font-bold">
                                                ✓
                                            </span>
 <p className="text-sm text-black/80 font-CeraGR leading-relaxed">
                                                {text}
                                            </p>
                                        </li>
                                    ))}
                                </ul>

                                <label
                                    htmlFor="mor_agreement"
                                    className="flex items-start gap-3 cursor-pointer bg-gray-50 border-2 border-black rounded-box-sm p-4 mb-5"
                                >
                                    <input
                                        type="checkbox"
                                        id="mor_agreement"
                                        name="mor_agreement"
                                        checked={data.mor_agreed}
                                        onChange={(e) =>
                                            setData("mor_agreed", e.target.checked)
                                        }
                                        className="mt-0.5 w-6 h-6 accent-[#FF007F] shrink-0"
                                    />
                                    <p className="text-sm font-bold text-black font-CeraGR leading-snug">
                                        I confirm and agree to be the Merchant of
                                        Record for all my transactions.
                                    </p>
                                </label>
                                {errors.mor_agreed && (
                                    <p className="text-red-500 text-sm mb-4">
                                        {errors.mor_agreed}
                                    </p>
                                )}

                                <button
                                    onClick={handleMorConsent}
                                    disabled={!data.mor_agreed || processing}
 className="block w-full text-center bg-[#FF007F] text-black font-gulfs uppercase text-base py-4 rounded-box-sm border-2 border-black active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:active:translate-x-0 disabled:active:translate-y-0"
                                >
                                    {processing ? (
                                        <Spinner label="Confirming…" />
                                    ) : (
                                        "Agree & continue"
                                    )}
                                </button>
 <p className="text-xs text-center text-black/60 font-CeraGR mt-3">
                                    Next: choose your country and connect Stripe.
                                </p>
                            </div>
                        </div>
                    ) : (
                        // ── Connect payments ──
                        <div className={cardCls}>
                            <div className="bg-black text-white px-6 py-4">
 <p className="text-[12px] font-bold uppercase tracking-widest text-mint">
                                    {stepLabel}
                                </p>
                                <h2 className="font-gulfs uppercase text-xl">
                                    {resuming
                                        ? "Finish your Stripe setup"
                                        : "Connect your payments"}
                                </h2>
                            </div>

                            <div className="p-6">
                                {/* What happens next — reassurance before the redirect */}
                                <div className="flex items-start gap-3 bg-mint/30 border-2 border-black rounded-box-sm p-4 mb-6">
                                    <span className="text-lg leading-none">🔒</span>
                                    <p className="text-sm text-black font-CeraGR leading-relaxed">
                                        <span className="font-bold">
                                            What happens next:
                                        </span>{" "}
                                        {resuming
                                            ? "we’ll take you back to Stripe, right where you left off. Nothing you already entered is lost."
                                            : "we’ll take you to Stripe to verify your details securely. It takes about 3 minutes, then you’ll come straight back here."}
                                    </p>
                                </div>

                                {/* Content-only checklist (calm, not alarming) */}
                                {!resuming && (
                                    <>
 <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-3">
                                    Before you connect, keep your profile
                                    content-only
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-2 mb-6">
                                    {contentRules.map((rule, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-box-sm p-2.5"
                                        >
 <span className="text-black/60 text-sm leading-none mt-0.5">
                                                ✕
                                            </span>
 <span className="text-[13px] text-black/80 font-CeraGR leading-snug">
                                                {rule}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Country */}
 <label className="block text-xs font-bold uppercase tracking-widest text-black/60 mb-2">
                                    Your country
                                </label>
                                <div className="mb-5">
                                    <Countries send={getCountry} />
                                </div>

                                {/* Email-receipt acknowledgement */}
                                <label
                                    htmlFor="creator_email_receipt_ack"
                                    className={`flex items-start gap-3 cursor-pointer bg-gray-50 border-2 border-black rounded-box-sm p-4 mb-3 ${
                                        creatorEmailReceiptAcked
                                            ? "opacity-70"
                                            : ""
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        ref={creatorEmailReceiptAckRef}
                                        id="creator_email_receipt_ack"
                                        name="creator_email_receipt_ack"
                                        checked={
                                            creatorEmailReceiptAcked ||
                                            !!data.creator_email_receipt_ack
                                        }
                                        disabled={creatorEmailReceiptAcked}
                                        onChange={(e) =>
                                            setData(
                                                "creator_email_receipt_ack",
                                                e.target.checked,
                                            )
                                        }
                                        className="mt-0.5 w-6 h-6 accent-[#FF007F] shrink-0 disabled:cursor-not-allowed"
                                    />
 <span className="text-sm text-black/80 font-CeraGR leading-snug">
                                        I understand my creator e-mail address may
                                        appear on supporter receipts and
                                        transaction records. Use a dedicated
                                        creator e-mail if you’d rather not share a
                                        personal one.
                                    </span>
                                </label>

                                {/* Terms */}
                                <label
                                    htmlFor="termaccept"
                                    className="flex items-start gap-3 cursor-pointer bg-gray-50 border-2 border-black rounded-box-sm p-4 mb-5"
                                >
                                    <input
                                        type="checkbox"
                                        ref={checkRef}
                                        id="termaccept"
                                        name="termaccept"
                                        required
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                            setTermsAccepted(e.target.checked);
                                            setData(
                                                "termaccept",
                                                e.target.checked
                                                    ? "termaccept"
                                                    : "",
                                            );
                                        }}
                                        className="mt-0.5 w-6 h-6 accent-[#FF007F] shrink-0"
                                    />
 <span className="text-sm text-black/80 font-CeraGR leading-snug">
                                        I’ll use Spenny Piggy in line with the
                                        Terms of Service, will post exclusive
                                        content in exchange for purchases,
                                        subscriptions and memberships, and will
                                        keep nothing from the list above on my
                                        profile.
                                    </span>
                                </label>
                                    </>
                                )}

                                <button
                                    onClick={checkTerms}
                                    disabled={!canConnect}
                                    className={`block w-full text-center font-gulfs uppercase text-base py-4 rounded-box-sm border-2 border-black transition-all ${
                                        canConnect
 ? "bg-[#FF007F] text-black active:translate-x-0.5 active:translate-y-0.5 "
 : "bg-gray-200 text-black/60 cursor-not-allowed"
                                    }`}
                                >
                                    {connecting ? (
                                        <Spinner label="Taking you to Stripe…" />
                                    ) : resuming ? (
                                        "Resume Stripe setup"
                                    ) : (
                                        "Connect with Stripe"
                                    )}
                                </button>

 <div className="flex items-center justify-center gap-2 mt-4 text-black/60">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                    <span className="text-xs font-CeraGR">
                                        Secured by Stripe
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Authenticated>
    );
}
