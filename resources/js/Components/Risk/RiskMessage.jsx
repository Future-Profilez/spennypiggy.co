/**
 * Renders a risk / account-state message produced by `App\Support\RiskMessages`.
 *
 * The server sends a fully resolved object — title, body, next step and a CTA
 * whose URL is already correct for THIS viewer. In particular a guest never
 * receives a link into the authenticated app, because the audience was resolved
 * on the server rather than branched on here. That is the whole point: this
 * component must not know or care whether the reader is signed in.
 *
 * Shape: { key, audience, title, body, next_step, cta, cta_secondary }
 * where cta is { label, url } and a null `url` means the surface supplies the
 * action itself (open the code field, fire a refund).
 */
export default function RiskMessage({
    message,
    tone = 'neutral',
    onAction,
    onSecondaryAction,
    className = '',
}) {
    if (!message?.title && !message?.body) return null;

    const { title, body, next_step: nextStep, cta, cta_secondary: ctaSecondary } = message;

    // Tone carries urgency only. There is no "error" red here on purpose — the
    // brief is explicit that these must not read as an accusation, and a red
    // panel is what makes someone reach for their bank instead of the chat.
    const TONES = {
        neutral: 'bg-white border-black',
        waiting: 'bg-[#FFF6E5] border-black',
        good: 'bg-[#EDFBF3] border-black',
    };

    return (
        <div
            className={`rounded-box border-2 ${TONES[tone] ?? TONES.neutral} p-5 sm:p-6 ${className}`}
            role="status"
            aria-live="polite"
        >
            {title ? (
                <h3 className="text-[17px] sm:text-[19px] font-bold leading-[1.3] text-black">
                    {title}
                </h3>
            ) : null}

            {body ? (
                // Paragraphs and bullets come through as newlines from the PHP,
                // so they are split rather than rendered as HTML — this copy is
                // never trusted as markup.
                <div className="mt-3 space-y-2">
                    {String(body)
                        .split('\n')
                        .filter((line) => line.trim() !== '')
                        .map((line, i) => (
                            <p key={i} className="text-[15px] leading-[1.55] text-black/75">
                                {line}
                            </p>
                        ))}
                </div>
            ) : null}

            {/* The next step is repeated as its own line because it is the one
                thing that stops this being a dead end — and a dead end is what
                sends someone to their bank instead of our chat. */}
            {nextStep ? (
                <p className="mt-4 text-[15px] font-semibold leading-[1.45] text-black">
                    {nextStep}
                </p>
            ) : null}

            {(cta || ctaSecondary) && (
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                    {cta ? (
                        <ActionButton action={cta} onAction={onAction} primary />
                    ) : null}
                    {ctaSecondary ? (
                        <ActionButton action={ctaSecondary} onAction={onSecondaryAction} />
                    ) : null}
                </div>
            )}
        </div>
    );
}

/**
 * A CTA is a link when the server resolved a URL for this audience, and a button
 * when it did not. A guest whose CTA lost its URL renders nothing at all rather
 * than a control that goes nowhere.
 */
function ActionButton({ action, onAction, primary = false }) {
    if (!action?.label) return null;

    // Touch target ≥44px, per the PWA rules.
    const base =
        'inline-flex min-h-[44px] items-center justify-center rounded-box-sm px-6 text-[15px] font-semibold transition';
    const style = primary
        ? `${base} bg-[#FF007F] text-white`
        : `${base} border-2 border-black bg-white text-black`;

    if (action.url) {
        return (
            <a href={action.url} className={style}>
                {action.label}
            </a>
        );
    }

    if (typeof onAction === 'function') {
        return (
            <button type="button" onClick={onAction} className={style}>
                {action.label}
            </button>
        );
    }

    return null;
}
