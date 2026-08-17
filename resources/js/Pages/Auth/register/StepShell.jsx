import { accentFor } from "./constants";

/**
 * The frame every step screen sits in: heading, one line of context, the white panel, and the
 * submit button.
 *
 * It exists because all four steps hand-rolled the same structure and had already drifted —
 * `sm:p-6` against `sm:p-7`, `sm:text-3xl` against `sm:text-4xl`, `mt-4` against `mt-4 sm:mt-6`,
 * and a six-line button class string copied four times whose disabled treatment was only fixed in
 * three of them. Spacing is a system, not a per-file decision.
 *
 * The scale below is the whole vocabulary. Nothing in a step should set its own vertical rhythm.
 */

/** Vertical rhythm, in one place. */
export const RHYTHM = {
    titleToSub: "mt-2",
    subToPanel: "mt-4 sm:mt-5",
    panelToAction: "mt-4",
    /** Inside the panel: between the main block and a secondary one. */
    panelDivide: "mt-4 border-t-2 border-dashed border-black/10 pt-4",
};

/** The white panel. One padding recipe, one radius, one shadow. */
export const PANEL =
    "rounded-box border-[3px] border-black bg-white p-4 sm:p-6";

export default function StepShell({
    role,
    title,
    subtitle,
    onSubmit,
    action,
    actionDisabled = false,
    actionNote = null,
    /** Optional block between the subtitle and the panel (e.g. the pricing promise). */
    lede = null,
    children,
    footer = null,
}) {
    const accent = accentFor(role);
    const enabled = !actionDisabled;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit?.();
            }}
            noValidate
        >
            <h1 className="font-gulfs text-2xl uppercase leading-[1.05] text-white sm:text-3xl">
                {title}
            </h1>

            {subtitle && (
                <p
                    className={`${RHYTHM.titleToSub} max-w-[46ch] text-sm text-white/70`}
                >
                    {subtitle}
                </p>
            )}

            {lede && <div className={RHYTHM.subToPanel}>{lede}</div>}

            <div className={`${RHYTHM.subToPanel} ${PANEL}`}>{children}</div>

            {footer}

            {action && (
                <button
                    type="submit"
                    disabled={actionDisabled}
                    className={`${RHYTHM.panelToAction} flex min-h-[56px] w-full items-center justify-center gap-2 rounded-box-sm border-[3px] font-gulfs text-base uppercase tracking-[0.14em] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/70 motion-reduce:hover:translate-y-0 ${
                        enabled
                            ? "border-black text-white hover:-translate-y-0.5"
                            : "cursor-not-allowed border-white/25 bg-white/5 text-white/60"
                    }`}
                    style={enabled ? { backgroundColor: accent.hex } : undefined}
                >
                    {action}
                </button>
            )}

            {actionNote && (
                <p className="mt-2.5 text-center text-sm text-white/60">
                    {actionNote}
                </p>
            )}
        </form>
    );
}
