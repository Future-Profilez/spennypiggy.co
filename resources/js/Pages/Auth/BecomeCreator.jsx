import { useEffect, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import axios from "axios";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { openLiveChat } from "@/lib/liveChat";
import Countries from "@/includes/Countries";
import CreatorProfileStep from "./register/CreatorProfileStep";
import Field, { fieldShell } from "./register/Field";
import StepShell, { RHYTHM } from "./register/StepShell";
import {
    MAX_CATEGORIES,
    MAX_PRIDE,
    ROLE_CREATOR,
    accentFor,
} from "./register/constants";

/**
 * A gifter turning their own account into a creator account.
 *
 * 🚨 THIS IS THE SIGNUP FORM'S CREATOR STEP, REUSED — not a second copy of it.
 * `register/CreatorProfileStep` takes every value as a prop, so the badges, the
 * social handle and the referral field here are literally the same screen a new
 * creator answers. A parallel form would drift the first time signup changed,
 * and the two would then ask for different things and validate differently.
 *
 * 🚨 NOTHING ON THIS PAGE CONVERTS THE ACCOUNT. The write is a POST to
 * `become.creator.store`; the entry points elsewhere in the app link to this
 * page and never at that route. See the controller for why.
 */

/**
 * One consent row. Deliberately a local copy of `register/ReviewStep`'s — that
 * one is a private function in that file, and exporting it would make a
 * signup-flow internal part of this page's contract.
 *
 * ⚠️ The `accentColor` AND `color` inline styles are both load-bearing:
 * `input[type="checkbox"]` carries a global `text-[#FF007F]` in
 * `resources/css/index.css`, and inline `color` is the only thing that reliably
 * beats it.
 */
function Consent({ id, checked, onChange, accentHex, children }) {
    return (
        <label
            htmlFor={id}
            className="flex cursor-pointer items-start gap-3 rounded-box-sm border-2 border-black/10 p-3.5 transition-colors hover:border-black/25"
        >
            <input
                id={id}
                name={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded border-2 border-black/25"
                style={{ accentColor: accentHex, color: accentHex }}
            />
            <span className="text-sm leading-relaxed text-black/70">
                {children}
            </span>
        </label>
    );
}

/**
 * What a refusal means, and what to do about it.
 *
 * 🚨 THE SERVER SENDS A CODE, NOT A SENTENCE. The wording belongs to the screen
 * that draws it, and a test asserting a gate should be matching a code rather
 * than prose. An unknown code falls back to the generic route — a refusal we
 * cannot describe must still lead somewhere.
 */
const BLOCKER_COPY = {
    email_unverified: {
        title: "Confirm your email address first",
        body: "Your creator email appears on supporter transaction records and receipts, so it has to be an address we know reaches you. Confirm it and come straight back.",
        // The only blocker with a page of its own to send somebody to.
        href: "/verification",
        label: "Confirm my email",
    },
    suspended: {
        title: "Your account is restricted right now",
        body: "While a restriction is on this account we cannot change what it is. Talk to our team and somebody will look at it with you.",
        talkToUs: true,
    },
    dispute_history: {
        title: "There is a payment on your account we are still looking at",
        body: "One of your purchases has an open dispute or chargeback against it. We settle those before an account starts selling. Talk to our team and somebody will pick it up.",
        talkToUs: true,
    },
};

export default function BecomeCreator({
    auth,
    blockers = [],
    prefill = {},
    retains = {},
    support_email: supportEmail = "",
}) {
    const accent = accentFor(ROLE_CREATOR);
    const [step, setStep] = useState("profile");

    /* ------------------------------- badges ------------------------------- */

    const [categories, setCategories] = useState(
        Array.isArray(prefill.creator_category) ? prefill.creator_category : [],
    );
    const [prideBadges, setPrideBadges] = useState(
        Array.isArray(prefill.pride_badges) ? prefill.pride_badges : [],
    );

    /* ------------------------------ the form ------------------------------ */

    const { data, setData, post, processing, errors } = useForm({
        social_platform: prefill.social_platform || "",
        social_handle: prefill.social_handle || "",
        creator_category: Array.isArray(prefill.creator_category)
            ? prefill.creator_category
            : [],
        pride_badges: Array.isArray(prefill.pride_badges)
            ? prefill.pride_badges
            : [],
        referral: "",
        // Only sent when the account has none — see the controller's rule.
        country: prefill.country || "",
        country_code: "",
        terms_accepted: false,
        creator_email_receipt_ack: false,
    });

    useEffect(() => {
        // Inertia can preserve this page instance while the conversion props
        // arrive. `useForm` only reads defaults on its first mount, so sync an
        // existing gifter handle when the server supplies it.
        if (!prefill.social_handle) return;

        setData({
            social_platform: prefill.social_platform || "",
            social_handle: prefill.social_handle,
        });
    }, [prefill.social_platform, prefill.social_handle]);

    const makeToggle = (setSelected, field, max) => (slug) => {
        setSelected((prev) => {
            const next = prev.includes(slug)
                ? prev.filter((s) => s !== slug)
                : prev.length >= max
                  ? prev
                  : [...prev, slug];
            setData(field, next);
            return next;
        });
    };

    const makeClear = (setSelected, field) => () => {
        setSelected([]);
        setData(field, []);
    };

    /* ----------------------------- referral ------------------------------- */

    const [referralMessage, setReferralMessage] = useState("");
    const [referralType, setReferralType] = useState("");

    /**
     * ⚠️ A literal path, not `route()`. A named route is invisible to the
     * frontend until `ziggy:generate` runs, and `route()` THROWS for a name the
     * generated snapshot does not carry — inside this `.catch()` that would
     * surface as "could not be checked", which no refresh could ever fix.
     */
    const checkReferral = () => {
        const code = data.referral.trim();

        if (!code) {
            setReferralMessage("");
            setReferralType("");
            return;
        }

        axios
            .get(`/check-referral-code/${code}`)
            .then((resp) => {
                if (resp.data.status) {
                    setReferralType("success");
                    setReferralMessage(resp.data.msg || "Code applied.");
                } else {
                    setReferralType("error");
                    setReferralMessage(resp.data.msg || "That code isn't valid.");
                }
            })
            .catch(() => {
                setReferralType("error");
                setReferralMessage("We could not check that code just now.");
            });
    };

    /* ------------------------------- refusal ------------------------------ */

    // 🚨 The form is REPLACED, never disabled beneath a notice. Leaving the
    // fields on screen invites a submit into a refusal that has not changed.
    if (blockers.length > 0) {
        return (
            <Authenticated auth={auth?.user || ""} user={auth?.user || ""}>
                <Head title="Become a creator" />

                <div className="min-h-dvh bg-[#0B0B0C] px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-10">
                    <div className="mx-auto w-full max-w-[560px]">
                        <h1 className="font-gulfs text-2xl uppercase leading-[1.05] text-white sm:text-3xl">
                            Not yet
                        </h1>
                        <p className="mt-2 max-w-[46ch] text-sm text-white/70">
                            {blockers.length > 1
                                ? "A couple of things have to be sorted before your account can start selling."
                                : "One thing has to be sorted before your account can start selling."}
                        </p>

                        <div className="mt-4 space-y-3 sm:mt-5">
                            {blockers.map((code) => {
                                // An unknown code still has to lead somewhere, and
                                // "talk to us" is the only answer that is true of
                                // every refusal we cannot name.
                                const copy =
                                    BLOCKER_COPY[code] ?? BLOCKER_COPY.suspended;

                                return (
                                    <div
                                        key={code}
                                        className="rounded-box border-black bg-white p-4 sm:p-6"
                                    >
                                        <h2 className="font-gulfs text-base uppercase leading-[1.15] text-black">
                                            {copy.title}
                                        </h2>
                                        <p className="mt-2 text-sm leading-[1.55] text-black/70">
                                            {copy.body}
                                        </p>

                                        {/*
                                            🚨 A REAL `mailto:` IN THE href, and
                                            `openLiveChat` cancels the click ONLY when
                                            the messenger is genuinely booted. There is
                                            no help-ticket route a role-0 account can
                                            use (`openHelp` refuses any role but 1), so
                                            this is the whole of the way out — and a
                                            control that swallows its own click and
                                            opens nothing is the exact dead end this
                                            page exists to avoid.
                                        */}
                                        <a
                                            href={
                                                copy.talkToUs
                                                    ? `mailto:${supportEmail}`
                                                    : copy.href
                                            }
                                            onClick={
                                                copy.talkToUs
                                                    ? openLiveChat
                                                    : undefined
                                            }
                                            className="mt-3 inline-flex min-h-[44px] items-center rounded-box-sm border-2 border-black bg-white px-4 text-sm font-bold text-black transition-colors duration-200 hover:bg-black/[0.04]"
                                        >
                                            {copy.talkToUs
                                                ? "Talk to our team"
                                                : copy.label}
                                        </a>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="mt-4 text-sm text-white/60">
                            Nothing about your account has changed. Your
                            purchases, subscriptions and saved items are exactly
                            where they were.
                        </p>
                    </div>
                </div>
            </Authenticated>
        );
    }

    /* ------------------------------ the steps ----------------------------- */

    const needsCountry = !!prefill.needs_country;
    const countryAnswered = !needsCountry || !!data.country;
    const consentsGiven = data.terms_accepted && data.creator_email_receipt_ack;
    const canSubmit = consentsGiven && countryAnswered && !processing;

    const submit = () => {
        if (!canSubmit) {
            return;
        }

        post("/become-creator");
    };

    return (
        <Authenticated auth={auth?.user || ""} user={auth?.user || ""}>
            <Head title="Become a creator" />

            <div className="relative min-h-dvh overflow-hidden bg-[#0B0B0C] px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-10">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-25"
                    style={{
                        background: `radial-gradient(60% 100% at 50% 0%, ${accent.hex} 0%, transparent 70%)`,
                    }}
                />

                <div className="relative mx-auto w-full max-w-[560px]">
                    {step === "profile" && (
                        <>
                            <CreatorProfileStep
                                categories={categories}
                                onToggleCategory={makeToggle(
                                    setCategories,
                                    "creator_category",
                                    MAX_CATEGORIES,
                                )}
                                onClearCategories={makeClear(
                                    setCategories,
                                    "creator_category",
                                )}
                                prideBadges={prideBadges}
                                onTogglePride={makeToggle(
                                    setPrideBadges,
                                    "pride_badges",
                                    MAX_PRIDE,
                                )}
                                onClearPride={makeClear(
                                    setPrideBadges,
                                    "pride_badges",
                                )}
                                referral={data.referral}
                                referralLocked={false}
                                onReferralChange={(value) =>
                                    setData("referral", value)
                                }
                                onReferralCheck={checkReferral}
                                referralMessage={referralMessage}
                                referralType={referralType}
                                socialPlatform={data.social_platform}
                                socialHandle={data.social_handle}
                                onSocialPlatformChange={(key) => {
                                    setData({
                                        social_platform: key,
                                        // Restore the stored handle when the user
                                        // returns to its original platform.
                                        social_handle:
                                            key === prefill.social_platform
                                                ? prefill.social_handle || ""
                                                : "",
                                    });
                                }}
                                onSocialHandleChange={(value) =>
                                    setData("social_handle", value)
                                }
                                socialError={errors.social_handle}
                                onSubmit={() => setStep("confirm")}
                            />

                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="mt-4 text-sm font-semibold text-white/60 underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                            >
                                Not now
                            </button>
                        </>
                    )}

                    {step === "confirm" && (
                        <StepShell
                            role={ROLE_CREATOR}
                            title="One last thing"
                            subtitle="Agree to the creator terms and your page is open."
                            onSubmit={submit}
                            action={
                                processing
                                    ? "Setting up your page"
                                    : !consentsGiven
                                      ? "Tick both boxes to continue"
                                      : !countryAnswered
                                        ? "Choose your country"
                                        : "Make me a creator"
                            }
                            actionDisabled={!canSubmit}
                        >
                            {/*
                                What changes, and what does not. The first thing
                                anybody asks before pressing this is whether they
                                lose what they have bought — so it is answered
                                before the consents rather than after them.
                            */}
                            <div className="rounded-box-sm border-2 border-black/10 p-3.5">
                                <p className="text-sm font-semibold text-black">
                                    What happens next
                                </p>
                                <ul className="mt-2 space-y-1.5 text-sm leading-[1.55] text-black/70">
                                    <li>
                                        Your photo, bio and cover go back for
                                        review, because a creator page is checked
                                        before it can sell. They are not deleted
                                        — you will see them exactly as they are.
                                    </li>
                                    <li>
                                        You keep every purchase, subscription and
                                        saved item on this account.
                                        {retains.card_verified
                                            ? " Your completed card verification carries over too."
                                            : ""}
                                    </li>
                                    <li>
                                        Then you add a card and connect Stripe, so
                                        we can pay you.
                                    </li>
                                </ul>
                            </div>

                            {needsCountry && (
                                <div className={RHYTHM.panelDivide}>
                                    <Field
                                        id="country"
                                        label="Country"
                                        error={errors.country}
                                        hint="Where you are based. Sets your currency and where your payouts are set up."
                                    >
                                        <Countries
                                            send={(raw) => {
                                                const c = JSON.parse(raw);
                                                setData((prev) => ({
                                                    ...prev,
                                                    country: c.label,
                                                    country_code: c.code,
                                                }));
                                            }}
                                            selectClassName={fieldShell("idle")}
                                        />
                                    </Field>
                                </div>
                            )}

                            <div className={`${RHYTHM.panelDivide} space-y-2.5`}>
                                <Consent
                                    id="terms_accepted"
                                    checked={data.terms_accepted}
                                    accentHex={accent.hex}
                                    onChange={(v) =>
                                        setData("terms_accepted", v)
                                    }
                                >
                                    I agree to the{" "}
                                    <a
                                        href="/terms-and-conditions"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold underline decoration-2 underline-offset-2"
                                        style={{ color: accent.hex }}
                                    >
                                        Terms &amp; Conditions
                                    </a>{" "}
                                    as a creator selling on Spenny Piggy.
                                </Consent>

                                <Consent
                                    id="creator_email_receipt_ack"
                                    checked={data.creator_email_receipt_ack}
                                    accentHex={accent.hex}
                                    onChange={(v) =>
                                        setData("creator_email_receipt_ack", v)
                                    }
                                >
                                    I understand my creator email address may
                                    appear on supporter transaction records and
                                    receipts. Most creators set up an address just
                                    for this.
                                </Consent>
                            </div>

                            {errors.conversion && (
                                <p className="mt-3 text-sm font-semibold text-[#C81E1E]">
                                    {errors.conversion}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => setStep("profile")}
                                className="mt-4 text-sm font-semibold text-black/60 underline decoration-2 underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                            >
                                Back
                            </button>
                        </StepShell>
                    )}
                </div>
            </div>
        </Authenticated>
    );
}
