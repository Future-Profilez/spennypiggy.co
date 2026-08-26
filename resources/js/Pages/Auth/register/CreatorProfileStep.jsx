import { useState } from "react";
import Field from "./Field";
import StepShell, { RHYTHM } from "./StepShell";
import BadgePicker, {
    PrideBadgePicker,
} from "@/Components/Badges/BadgePicker";
import {
    CREATOR_CATEGORY_GROUPS,
    MAX_CATEGORIES,
    MAX_PRIDE,
    accentFor,
    ROLE_CREATOR,
    SOCIAL_PLATFORMS,
    creatorProfileStepAction,
    creatorProfileStepComplete,
} from "./constants";

/**
 * Creator-only screen: what you make, who you are, and who sent you.
 *
 * The categories were 17 ungrouped text chips with "select at least one"
 * enforced by a toast after the fact. They're badges now — grouped, iconed and
 * capped — and the button says what's missing instead of sitting disabled with
 * no explanation.
 *
 * 🚨 Pride badges are a SEPARATE picker writing a SEPARATE field, and it is
 * optional in a way the interest picker is not. They are special-category data
 * (see `App\Support\Badges`), so they must never be required to finish signup
 * and must never travel in the same field as the public interest badges.
 */
export default function CreatorProfileStep({
    categories,
    onToggleCategory,
    onClearCategories,
    prideBadges = [],
    onTogglePride,
    onClearPride,
    referral,
    referralLocked,
    onReferralChange,
    onReferralCheck,
    referralMessage,
    referralType,
    socialPlatform,
    socialHandle,
    onSocialPlatformChange,
    onSocialHandleChange,
    socialError,
    onSubmit,
}) {
    const accent = accentFor(ROLE_CREATOR);
    const [showReferral, setShowReferral] = useState(
        referralLocked || !!referral,
    );

    return (
        <StepShell
            role={ROLE_CREATOR}
            title="Add your badges"
            subtitle={`Pick up to ${MAX_CATEGORIES} — it's how supporters find you.`}
            onSubmit={onSubmit}
            action={creatorProfileStepAction({ categories, socialHandle })}
            actionDisabled={
                !creatorProfileStepComplete({ categories, socialHandle })
            }
        >
            {/* Grouped, but the group name rides on the same line as its
                chips rather than taking a row of its own — five extra rows
                of legend is what would push this screen past the fold. */}
            <BadgePicker
                title="Your badges"
                groups={CREATOR_CATEGORY_GROUPS}
                selected={categories}
                onToggle={onToggleCategory}
                onClear={onClearCategories}
                max={MAX_CATEGORIES}
                accentHex={accent.hex}
            />

            {/* Optional, and said so — this is the only field on the whole
                signup flow asking for something a creator has every right to
                keep to themselves. */}
            <div className={RHYTHM.panelDivide}>
                <PrideBadgePicker
                    title="Pride badges"
                    hint={`Optional. Shown on your profile, and never used to advertise you. Up to ${MAX_PRIDE}.`}
                    selected={prideBadges}
                    onToggle={onTogglePride}
                    onClear={onClearPride}
                    max={MAX_PRIDE}
                    accentHex={accent.hex}
                />
            </div>

            {/* 🚨 REQUIRED (client decision, 25 Aug 2026) — the step's button is
                gated on it by `creatorProfileStepComplete`, and the server enforces
                it with `Rule::requiredIf`.

                It is not new friction, it is friction moved earlier: a creator
                already cannot go live without an APPROVED handle
                (`Profile/CreatorVerification.jsx` locks "Submit for review" until
                socials, photo and bio are approved), so this only asks for it before
                they reach the dashboard instead of after.

                ⚠️ THE GATE BELONGS TO THIS STEP, NOT TO `canSubmitRegistration` —
                that is the CONSENT check, and bundling a product requirement into it
                is how an optional consent quietly becomes conditional.

                🚨 THE COPY MUST NOT PROMISE PRIVACY. The handle goes for review and
                then appears on the creator's profile like any other. An earlier draft
                said "it is not shown on your profile", which was true of the
                contact-only design this replaced and is a lie about the shipped
                one. */}
            <div className={RHYTHM.panelDivide}>
                <p className="text-sm font-semibold text-black">
                    Add a social account
                </p>
                <p className="mt-1 text-xs leading-[1.55] text-black/60">
                    This gets your social step done now, so you will not be asked
                    again. We check it before it shows on your profile, and we never
                    post anything.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                    {SOCIAL_PLATFORMS.map((platform) => {
                        const active = socialPlatform === platform.key;

                        return (
                            <button
                                key={platform.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                    onSocialPlatformChange(platform.key)
                                }
                                className={`rounded-box-sm border-black px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                                    active
                                        ? "bg-black text-white"
                                        : "bg-white text-black hover:bg-black/[0.04]"
                                }`}
                            >
                                {platform.label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-3">
                    <Field
                        id="social_handle"
                        label="Username"
                        prefix="@"
                        value={socialHandle}
                        placeholder={
                            SOCIAL_PLATFORMS.find(
                                (p) => p.key === socialPlatform,
                            )?.placeholder ?? "yourname"
                        }
                        autoCapitalize="none"
                        spellCheck="false"
                        error={socialError}
                        status={socialError ? "error" : "idle"}
                        onChange={(e) => onSocialHandleChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Referral is a minority case, so it costs a tap rather than a
                    permanent field. A code arriving in the URL opens it. */}
            <div className={RHYTHM.panelDivide}>
                {showReferral ? (
                    <>
                        <Field
                            id="promo"
                            label="Referral code"
                            optional
                            value={referral}
                            placeholder="Paste a creator's code"
                            autoCapitalize="none"
                            spellCheck="false"
                            readOnly={referralLocked}
                            error={
                                referralType === "error"
                                    ? referralMessage
                                    : undefined
                            }
                            onChange={(e) => onReferralChange(e.target.value)}
                            onBlur={onReferralCheck}
                            status={
                                referralType === "success" ? "success" : "idle"
                            }
                        />
                        {referralType === "success" && referralMessage && (
                            <p className="mt-1.5 text-xs font-medium text-[#0A8F6C]">
                                {referralMessage}
                            </p>
                        )}
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowReferral(true)}
                        className="text-sm font-semibold text-black/60 underline decoration-2 underline-offset-4 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                    >
                        Got a referral code?
                    </button>
                )}
            </div>
        </StepShell>
    );
}
