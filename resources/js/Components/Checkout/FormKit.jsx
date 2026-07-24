/**
 * The one form-control vocabulary for every checkout surface.
 *
 * Before this, the eight payment screens each invented their own: three border
 * treatments (1px gray / 2px gray / 3px black), three paddings (py-2 / py-3 /
 * none), three focus rings (ring-0 / ring-1 / ring-4) and stray `rounded-lg`
 * against a design system that allows only 30px containers and 20px controls.
 * Import from here instead of hand-rolling a field — if a control needs to look
 * different, change it here so every checkout changes with it.
 *
 * Design system (DESIGN.md): controls are 20px radius (`rounded-box-sm`), ink is
 * #0B0B0F, the single accent is pink #FF007F. Body copy never drops below
 * text-black/60 — below that it fails WCAG AA against white.
 */

/** Shared control recipe. 44px min height is the mobile touch floor. */
export const fieldClass =
    "w-full rounded-box-sm border-2 border-black/15 bg-white px-4 py-3 min-h-[44px] text-[15px] font-medium text-black placeholder:text-black/60 transition-colors duration-150 motion-reduce:transition-none focus:outline-none focus:border-black focus:ring-4 focus:ring-[#FF007F]/25 disabled:bg-black/5 disabled:text-black/50 disabled:cursor-not-allowed";

/** Field label. One weight, one size, everywhere. */
export function Label({ htmlFor, children, hint = null, required = false }) {
    return (
        <label htmlFor={htmlFor} className="block mb-1.5">
            <span className="font-black uppercase tracking-widest text-[11px] text-black/70">
                {children}
                {required && <span className="text-[#FF007F] ml-0.5">*</span>}
            </span>
            {hint && (
                <span className="block text-[12px] font-medium text-black/60 mt-0.5 normal-case tracking-normal">
                    {hint}
                </span>
            )}
        </label>
    );
}

/** Inline validation / error text. Never colour-only — it leads with an icon. */
export function FieldError({ children }) {
    if (!children) return null;

    return (
        <p role="alert" className="flex items-start gap-1.5 text-[12px] font-bold text-[#C81E5B] mt-1.5">
            <span aria-hidden="true">!</span>
            {children}
        </p>
    );
}

/** Labelled text input. */
export function TextField({
    id,
    label,
    hint = null,
    error = null,
    required = false,
    className = "",
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <Label htmlFor={id} hint={hint} required={required}>
                    {label}
                </Label>
            )}
            <input
                id={id}
                aria-invalid={error ? "true" : undefined}
                className={fieldClass}
                {...props}
            />
            <FieldError>{error}</FieldError>
        </div>
    );
}

/** Labelled textarea. */
export function TextAreaField({
    id,
    label,
    hint = null,
    error = null,
    rows = 3,
    className = "",
    ...props
}) {
    return (
        <div className={className}>
            {label && (
                <Label htmlFor={id} hint={hint}>
                    {label}
                </Label>
            )}
            <textarea id={id} rows={rows} aria-invalid={error ? "true" : undefined} className={fieldClass} {...props} />
            <FieldError>{error}</FieldError>
        </div>
    );
}

/**
 * The secondary action for checkout: Back, Cancel, Copy link, Clear basket.
 * Same shape and radius as PayButton so the pair reads as one system — the
 * primary carries the colour, this one carries the outline.
 */
export function SecondaryButton({
    label,
    processing = false,
    processingLabel = "Working…",
    disabled = false,
    onClick,
    type = "button",
    className = "",
}) {
    const off = disabled || processing;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={off}
            className={`w-full border-[3px] border-black rounded-box-sm px-4 py-3 min-h-[44px] font-black uppercase tracking-wide text-sm bg-white transition-[transform,box-shadow] duration-150 motion-reduce:transition-none focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 ${
                off
                    ? "text-black/40 border-black/25 cursor-not-allowed"
                    : "text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
            } ${className}`}
        >
            {processing ? processingLabel : label}
        </button>
    );
}

/**
 * Low-emphasis text action (Back a step, Edit details). Still a real button with
 * a 44px hit area — the underline-only text links in the pot stepper were below
 * the touch floor.
 */
export function QuietButton({ label, onClick, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center min-h-[44px] px-2 font-black uppercase tracking-widest text-[11px] text-black/70 underline underline-offset-4 hover:text-black focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]/40 rounded-box-sm ${className}`}
        >
            {label}
        </button>
    );
}
