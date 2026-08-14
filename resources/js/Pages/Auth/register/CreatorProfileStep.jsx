import { useState } from "react";
import Field from "./Field";
import StepShell, { RHYTHM } from "./StepShell";
import {
    CREATOR_CATEGORY_GROUPS,
    MAX_CATEGORIES,
    accentFor,
    ROLE_CREATOR,
} from "./constants";

/**
 * Creator-only screen: what you make, and who sent you.
 *
 * The categories were 17 ungrouped chips with "select at least one" enforced by
 * a toast after the fact. They're grouped now, capped at three, and the button
 * says what's missing instead of sitting disabled with no explanation.
 */
export default function CreatorProfileStep({
    categories,
    onToggleCategory,
    referral,
    referralLocked,
    onReferralChange,
    onReferralCheck,
    referralMessage,
    referralType,
    onSubmit,
}) {
    const accent = accentFor(ROLE_CREATOR);
    const atLimit = categories.length >= MAX_CATEGORIES;
    const chosen = categories.length;
    const [showReferral, setShowReferral] = useState(
        referralLocked || !!referral,
    );

    return (
        <StepShell
            role={ROLE_CREATOR}
            title="What do you make?"
            subtitle={`Pick up to ${MAX_CATEGORIES} — it's how supporters find you.`}
            onSubmit={onSubmit}
            action={chosen < 1 ? "Pick at least one category" : "Continue"}
            actionDisabled={chosen < 1}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/60">
                    Categories
                </span>
                <span
                    className="text-xs font-semibold"
                    style={{ color: chosen ? accent.hex : undefined }}
                >
                    {chosen} of {MAX_CATEGORIES}
                </span>
            </div>

            {/* Grouped, but the group name rides on the same line as its
                    chips rather than taking a row of its own — four extra rows
                    of legend is what pushed this screen past the fold. */}
            <div className="space-y-3">
                {CREATOR_CATEGORY_GROUPS.map((group) => (
                    <fieldset key={group.group}>
                        <legend className="sr-only">{group.group}</legend>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 w-full text-[12px] font-semibold uppercase tracking-[0.12em] text-black/60 sm:w-auto">
                                {group.group}
                            </span>
                            {group.items.map((item) => {
                                const selected = categories.includes(item);
                                const blocked = atLimit && !selected;
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        aria-pressed={selected}
                                        disabled={blocked}
                                        onClick={() => onToggleCategory(item)}
                                        className={`min-h-[44px] rounded-full border-2 px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                                            selected
                                                ? "border-black text-white"
                                                : blocked
                                                  ? // Disabled controls are exempt from the
                                                    // contrast floor and have to LOOK disabled;
                                                    // raising this to /60 made a chip you cannot
                                                    // press read as one you can.
                                                    "cursor-not-allowed border-black/10 bg-white text-black/60"
                                                  : "border-black/15 bg-white text-black/70 hover:border-black/40"
                                        }`}
                                        style={
                                            selected
                                                ? {
                                                      backgroundColor:
                                                          accent.hex,
                                                  }
                                                : undefined
                                        }
                                    >
                                        {item}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                ))}
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
