import { ACCENT } from './tokens';

/**
 * A small state label. One word about the state of one thing.
 *
 * Props:
 *   tone   'neutral' (default) | 'pink' | 'mint' | 'violet' | 'yellow' | 'danger'
 *   solid  fill the chip instead of tinting it — for the one state on a row
 *          that actually needs to be read first
 *   dot    render a leading dot
 *
 * ⚠️ `danger` is for a genuine failure — a payment that did not go through,
 * income that has stopped. It is NOT for "worse than last week": slipping two
 * places on a leaderboard or earning less this month is not an error, and
 * painting it red teaches the creator to ignore the colour when it matters.
 *
 * ⚠️ The state is never carried by colour alone — the chip always has a label,
 * so it survives a colourblind reader and a greyscale screenshot.
 */

const TONE = {
    neutral: { hex: '#000000', tint: 'bg-black/[0.06]', text: 'text-black/70' },
    pink: { hex: ACCENT.pink.hex, tint: 'bg-[#FF007F]/10', text: 'text-[#B3005A]' },
    mint: { hex: ACCENT.mint.hex, tint: 'bg-[#05EFB8]/15', text: 'text-[#046B54]' },
    violet: { hex: ACCENT.violet.hex, tint: 'bg-[#8C52FF]/12', text: 'text-[#5B27C4]' },
    yellow: { hex: ACCENT.yellow.hex, tint: 'bg-[#E6EA7B]/35', text: 'text-[#5B5E12]' },
    danger: { hex: '#D92D20', tint: 'bg-[#D92D20]/10', text: 'text-[#A21C13]' },
};

export default function Chip({
    tone = 'neutral',
    solid = false,
    dot = false,
    className = '',
    children,
}) {
    const t = TONE[tone] ?? TONE.neutral;

    /*
     * ⚠️ The tinted form takes a DARKENED text colour, not the raw accent. Raw
     * #FF007F on its own 10% tint measures under AA at this size — the same trap
     * the toaster's `labelColor` exists to avoid. The solid form takes black,
     * per the filled-brand-block rule.
     */
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-box-xs px-2.5 py-1',
                'font-gulfs uppercase tracking-[0.1em] text-[11px] leading-none',
                solid ? 'text-black' : `${t.tint} ${t.text}`,
                className,
            ].join(' ')}
            style={solid ? { backgroundColor: t.hex } : undefined}
        >
            {dot && (
                <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: solid ? '#000' : t.hex }}
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
}
