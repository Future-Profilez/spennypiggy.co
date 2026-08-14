import { ACCENT, TYPE } from './tokens';

/**
 * A section heading: eyebrow, title, an optional action, and a rule that runs
 * to the end of the row.
 *
 * The rule is what makes a heading read as the top of a section rather than as
 * a stray line of bold text — the creator screens had six different heading
 * treatments (`text-2xl font-black`, `headingLg`, a gradient, a bare `<h2>`),
 * so the page had no visible structure above the cards.
 *
 * Props:
 *   eyebrow   short tracked-out label above the title, in the section's accent
 *   title     the heading itself
 *   accent    pink | mint | violet | yellow — colours the eyebrow and the rule
 *   action    node rendered at the end of the row (a link, a filter, a button)
 *   tone      'paper' (default) | 'ink' — flips the type colour for dark bands
 *
 * ⚠️ ONE accent per section. The accent belongs on the eyebrow and the rule, not
 * on the title: coloured display type at this size is the thing that made the
 * older screens read as a template.
 */
export default function SectionHead({
    eyebrow = null,
    title,
    accent = 'pink',
    action = null,
    tone = 'paper',
    className = '',
}) {
    const a = ACCENT[accent] ?? ACCENT.pink;
    const ink = tone === 'ink';

    return (
        <div className={`mb-5 md:mb-6 ${className}`}>
            {eyebrow && (
                <p className={`${TYPE.eyebrow} mb-2`} style={{ color: a.hex }}>
                    {eyebrow}
                </p>
            )}

            <div className="flex items-end justify-between gap-4">
                <h2
                    className={`${TYPE.display} text-[22px] md:text-[28px] leading-[0.95] ${
                        ink ? 'text-white' : 'text-black'
                    }`}
                >
                    {title}
                </h2>
                {action && <div className="shrink-0">{action}</div>}
            </div>

            <div
                className="mt-3 h-[3px] w-full"
                style={{ backgroundColor: a.hex }}
                aria-hidden="true"
            />
        </div>
    );
}
