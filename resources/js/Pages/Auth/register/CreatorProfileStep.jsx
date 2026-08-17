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
    onSubmit,
}) {
    const accent = accentFor(ROLE_CREATOR);
    const chosen = categories.length;
    const [showReferral, setShowReferral] = useState(
        referralLocked || !!referral,
    );

    return (
        <StepShell
            role={ROLE_CREATOR}
            title="Add your badges"
            subtitle={`Pick up to ${MAX_CATEGORIES} — it's how supporters find you.`}
            onSubmit={onSubmit}
            action={chosen < 1 ? "Pick at least one badge" : "Continue"}
            actionDisabled={chosen < 1}
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
