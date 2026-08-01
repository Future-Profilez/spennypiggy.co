import { useState } from "react";
import { router } from "@inertiajs/react";
import Countries from "@/includes/Countries";
import Field, { fieldShell } from "./Field";
import StepShell from "./StepShell";
import {
    PASSWORD_RULES,
    ROLE_CREATOR,
    accentFor,
    passwordScore,
} from "./constants";

// Written without spaces so all three fit one row at 390px.
const PRONOUNS = [
    { value: "she", label: "She/her" },
    { value: "he", label: "He/him" },
    { value: "they", label: "They/them" },
];

const EyeIcon = ({ off }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
    >
        {off ? (
            <>
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M16.7 16.7A9.9 9.9 0 0 1 12 18c-5 0-9-6-9-6a17 17 0 0 1 4.2-4.9M9.9 4.2A9.9 9.9 0 0 1 12 4c5 0 9 6 9 6a17 17 0 0 1-2.2 2.9" />
                <path d="M2 2l20 20" />
            </>
        ) : (
            <>
                <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="3" />
            </>
        )}
    </svg>
);

/**
 * Screen two of the form: how you sign in.
 *
 * Email, password, pronouns, and — for a supporter — country, which sets their
 * display currency. There is no confirm-password field: with a working reveal
 * toggle it only ever cost a retype, and the orchestrator keeps the server's
 * `confirmed` rule satisfied by writing both values.
 */
export default function CredentialsStep({
    role,
    data,
    setData,
    onCountry,
    fieldStatus,
    fieldError,
    onFieldBlur,
    onSubmit,
    canContinue,
    googleProfile = null,
}) {
    const [showPassword, setShowPassword] = useState(false);
    const accent = accentFor(role);
    const isCreator = Number(role) === ROLE_CREATOR;
    // A Google signup arrives with a verified email and no password to choose. The screen is
    // only reached at all by a supporter, because it still carries their country.
    const viaGoogle = !!googleProfile;
    const score = passwordScore(data.password);
    const strengthLabel = [
        "",
        "Weak",
        "Weak",
        "Getting there",
        "Good",
        "Strong",
    ][score];
    const nextRule = PASSWORD_RULES.find((r) => !r.test(data.password || ""));

    return (
        <StepShell
            role={role}
            title={viaGoogle ? "A couple of details" : "How you sign in"}
            subtitle={
                viaGoogle
                    ? "Your country sets the currency you see prices in."
                    : isCreator
                      ? "Your email also appears on supporter receipts."
                      : "We'll send your receipts here."
            }
            onSubmit={onSubmit}
            action="Continue"
            actionDisabled={!canContinue}
        >
            <div className="space-y-4">
                {viaGoogle && (
                    <div className="flex items-center justify-between gap-3 rounded-box-sm border-2 border-black/10 bg-black/[0.03] p-3">
                        <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#05EFB8] text-black">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                >
                                    <path d="M20 6 9 17l-5-5" />
                                </svg>
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
                                    Signed in with Google
                                </span>
                                <span className="block truncate text-sm font-semibold text-black">
                                    {googleProfile.email}
                                </span>
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.post(route("auth.google.cancel"))}
                            className="text-xs font-bold text-red-600 hover:underline shrink-0"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {!viaGoogle && (
                    <>
                        <Field
                            id="email"
                            name="email"
                            type="email"
                            label="Email"
                            value={data.email}
                            autoComplete="email"
                            inputMode="email"
                            autoCapitalize="none"
                            spellCheck="false"
                            autoFocus
                            placeholder="you@example.com"
                            status={fieldStatus("email")}
                            error={fieldError("email")}
                            onChange={(e) => setData("email", e.target.value)}
                            onBlur={() => onFieldBlur("email")}
                        />

                        <Field
                            id="password"
                            name="password"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={data.password}
                            autoComplete="new-password"
                            status={fieldStatus("password")}
                            error={fieldError("password")}
                            onChange={(e) =>
                                setData((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                    password_confirmation: e.target.value,
                                }))
                            }
                            onBlur={() => onFieldBlur("password")}
                            suffix={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-black/60 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    <EyeIcon off={showPassword} />
                                </button>
                            }
                        />

                        {/* Strength bars plus the single next thing missing — the old
                        form listed all five rules in a permanent panel, most of
                        which were already met. */}
                        {data.password && (
                            <div className="-mt-1.5 flex items-center gap-3">
                                <div className="flex flex-1 gap-1">
                                    {PASSWORD_RULES.map((rule, i) => (
                                        <span
                                            key={rule.key}
                                            className="h-1.5 flex-1 rounded-full transition-colors"
                                            style={{
                                                backgroundColor:
                                                    i < score
                                                        ? score >= 4
                                                            ? "#05EFB8"
                                                            : accent.hex
                                                        : "rgba(0,0,0,0.1)",
                                            }}
                                        />
                                    ))}
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-black/60">
                                    {nextRule
                                        ? `Add ${nextRule.label.toLowerCase()}`
                                        : strengthLabel}
                                </span>
                            </div>
                        )}
                    </>
                )}

                {!isCreator && (
                    <Field
                        id="country"
                        label="Country"
                        status={fieldStatus("country")}
                        error={fieldError("country")}
                        hint="Sets your currency. Billing address is collected at your first purchase."
                    >
                        <Countries
                            send={onCountry}
                            selectClassName={fieldShell(fieldStatus("country"))}
                        />
                    </Field>
                )}

                <div>
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
                        Pronouns
                    </span>
                    <div
                        role="radiogroup"
                        aria-label="Pronouns"
                        className="flex flex-wrap gap-2"
                    >
                        {PRONOUNS.map((p) => {
                            const selected = data.gender === p.value;
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setData("gender", p.value)}
                                    className={`min-h-[44px] rounded-full border-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                                        selected
                                            ? "border-black text-white"
                                            : "border-black/15 bg-white text-black/60 hover:border-black/40"
                                    }`}
                                    style={
                                        selected
                                            ? { backgroundColor: accent.hex }
                                            : undefined
                                    }
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </StepShell>
    );
}
