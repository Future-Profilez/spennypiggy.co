import { RefreshCw } from "lucide-react";
import StepShell from "./StepShell";
import { ROLE_CREATOR, accentFor } from "./constants";

/**
 * Last screen: what you agreed to, and what happens next.
 *
 * The consents used to be three checkboxes plus a modal that opened on submit
 * and asked for a fourth. Everything a person is agreeing to is on the page
 * now, before they press the button.
 *
 * The submit control is a plain <button> rather than the shared LoaderButton:
 * that component hardcodes `rounded-box` and `main-button`, which fight the
 * house radius tokens, and it renders its spinner whenever `disabled` is set —
 * so an unticked consent box would show the form as though it were saving.
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
                /* `input[type="checkbox"]` carries a global `text-[#FF007F]` in
                   resources/css/index.css, which is the checked fill under
                   @tailwindcss/forms — so a supporter's violet form drew pink
                   ticks. Inline `color` is the only thing that reliably wins. */
                style={{ accentColor: accentHex, color: accentHex }}
            />
            <span className="text-sm leading-relaxed text-black/70">
                {children}
            </span>
        </label>
    );
}

export default function ReviewStep({
    role,
    data,
    consents,
    setConsent,
    turnstileSiteKey,
    bindTurnstile,
    processing,
    canSubmit,
    onSubmit,
    plan,
}) {
    const accent = accentFor(role);
    const isCreator = Number(role) === ROLE_CREATOR;

    // One line, not a three-item list. The detail a creator actually needs —
    // that the social profile must be public and active — belongs on the screen
    // that asks for it, not as a warning here.
    const nextUp = isCreator
        ? "Next: link a public social profile, verify your identity, then publish."
        : "Next: confirm your email, then find creators on Discover.";

    const blocker = !consents.terms
        ? "Accept the terms to continue."
        : isCreator && !consents.creatorEmail
          ? "Confirm the receipts notice to continue."
          : !isCreator && !consents.ownDetails
            ? "Confirm your details to continue."
            : "Complete the check above to continue.";

    return (
        <StepShell
            role={role}
            title="One last thing"
            subtitle={`Creating an account for ${data.email}.`}
            onSubmit={onSubmit}
            actionNote={!canSubmit && !processing ? blocker : null}
            lede={
                isCreator && plan?.free_until_first_sale ? (
                    <div
                        className="rounded-box border-[3px] border-black bg-[#E6EA7B] p-4"
                        style={{ boxShadow: `5px 5px 0 0 ${accent.hex}` }}
                    >
                        <p className="font-gulfs text-base uppercase leading-tight text-black">
                            {plan.promise}
                        </p>
                        <p className="mt-1 text-sm text-black/70">
                            {plan.price_line}.
                        </p>
                    </div>
                ) : null
            }
            footer={
                <button
                    type="submit"
                    disabled={!canSubmit || processing}
                    className={`mt-4 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-box-sm border-[3px] font-gulfs text-base uppercase tracking-[0.14em] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 motion-reduce:hover:translate-y-0 ${
                        canSubmit && !processing
                            ? "border-black text-white hover:-translate-y-0.5"
                            : "cursor-not-allowed border-white/25 bg-white/5 text-white/60"
                    }`}
                    style={
                        canSubmit && !processing
                            ? { backgroundColor: accent.hex }
                            : undefined
                    }
                >
                    {processing && (
                        <RefreshCw
                            size={18}
                            className="animate-spin"
                            aria-hidden
                        />
                    )}
                    {processing
                        ? "Creating account"
                        : isCreator
                          ? "Create my page"
                          : "Create account"}
                </button>
            }
        >
            <div className="space-y-2.5">
                <Consent
                    id="termaccept"
                    checked={consents.terms}
                    accentHex={accent.hex}
                    onChange={(v) => setConsent("terms", v)}
                >
                    I'm 18 or over and I agree to the{" "}
                    <a
                        href={route("terms-and-conditions")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline decoration-2 underline-offset-2"
                        style={{ color: accent.hex }}
                    >
                        Terms &amp; Conditions
                    </a>
                    .
                </Consent>

                {isCreator ? (
                    <Consent
                        id="creator_email_receipt_ack"
                        checked={consents.creatorEmail}
                        accentHex={accent.hex}
                        onChange={(v) => setConsent("creatorEmail", v)}
                    >
                        I understand my creator email address may appear on
                        supporter transaction records and receipts.
                    </Consent>
                ) : (
                    <Consent
                        id="ownDetails"
                        checked={consents.ownDetails}
                        accentHex={accent.hex}
                        onChange={(v) => setConsent("ownDetails", v)}
                    >
                        These are my own details, and I'll use this name and
                        email when I pay. One account per person — using someone
                        else's details will suspend it.
                    </Consent>
                )}
            </div>

            {turnstileSiteKey && (
                <div className="mt-4 flex justify-center">
                    <div ref={bindTurnstile} />
                </div>
            )}

            <p className="mt-4 border-t-2 border-dashed border-black/10 pt-3 text-xs text-black/60">
                {nextUp}
            </p>
        </StepShell>
    );
}
