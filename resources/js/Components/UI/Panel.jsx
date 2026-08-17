import { ACCENT } from './tokens';

/**
 * The house card: white surface, hard black frame, house radius.
 *
 * 🚨 NO SHADOWS ANYWHERE (client direction, 14 Aug 2026). The frame is a LINE.
 * Every card, panel, button and overlay on this site now separates itself with
 * a border and with space; the offset shadow that used to do that job is gone
 * from ~850 elements and must not come back one component at a time.
 *
 * Depth is expressed by three things instead, in this order:
 *   1. border WEIGHT   — `border-[3px]` for a container, `border-2` for a control
 *   2. border COLOUR   — black for structure, an accent for the one thing that matters
 *   3. SPACE           — the cheapest and quietest separator, and the one this app
 *                        had the least of
 *
 * Props:
 *   tone     'paper' (default) | 'ink' | 'accent'
 *   accent   pink | mint | violet | yellow — colours the FRAME, not a shadow
 *   emphasis 'quiet' | 'normal' (default) | 'strong' — border weight
 *   pad      'none' | 'sm' | 'md' (default) | 'lg'
 *   as       element or component to render — defaults to a div
 */

const EMPHASIS = {
    quiet: 'border',
    normal: 'border-[3px]',
    strong: 'border-4',
};

const PAD = {
    none: '',
    sm: 'p-4',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8',
};

export default function Panel({
    tone = 'paper',
    accent = null,
    emphasis = 'normal',
    pad = 'md',
    className = '',
    as: Tag = 'div',
    children,
    ...rest
}) {
    const a = accent ? ACCENT[accent] : null;

    const surface =
        tone === 'ink'
            ? 'bg-[#12131A] text-white'
            : tone === 'accent' && a
              ? `${a.bg} text-black`
              : 'bg-white text-black';

    /*
     * An accent panel is already a block of colour, so its own frame stays black
     * — an accent border on an accent fill is invisible, and the black is what
     * ties it back to every other card on the page.
     */
    const frame = tone === 'accent' || !a ? 'border-black' : a.border;

    return (
        <Tag
            className={`${EMPHASIS[emphasis] ?? EMPHASIS.normal} ${frame} rounded-box ${surface} ${PAD[pad] ?? PAD.md} ${className}`}
            {...rest}
        >
            {children}
        </Tag>
    );
}

/**
 * The press idiom for a Panel that is genuinely a button or a link.
 *
 * ⚠️ With no shadow to move into, the feedback is BRIGHTNESS plus a 2px shift
 * (client direction). Brightness is what reads on a filled control, the shift is
 * what reads on a white one, and neither changes the element's size — scaling on
 * hover or tap is banned app-wide.
 */
export const PRESS =
    'transition-[transform,filter,background-color] duration-150 ' +
    'hover:brightness-110 active:brightness-95 ' +
    'active:translate-x-[2px] active:translate-y-[2px] ' +
    'motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0';
