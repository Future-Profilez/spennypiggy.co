/**
 * The four onboarding marks.
 *
 * Flat, outlined, one fill — the same drawing language as the launch screen
 * (`app.blade.php`) and the generated launch images: solid brand blocks, hard
 * black outlines, no gradient and no shadow.
 *
 * 🚨 They replaced EMOJI. An emoji is drawn by the OS, so the same slide looked
 * like a different product on iOS, Android and a desktop install — and it is the
 * one element in this flow the brand does not control.
 *
 * ⚠️ Yellow is the only fill used here, on purpose. Mint is spent entirely on the
 * single action (the button) and violet is the progress field, so a mark tinted
 * in either would compete with the two things that carry meaning.
 */
const YELLOW = '#E6EA7B';

const stroke = {
    stroke: '#000',
    strokeWidth: 5,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
};

function Piece() {
    // A piece of content: a tile with a title line.
    return (
        <>
            <rect x="7" y="14" width="86" height="72" rx="18" fill={YELLOW} {...stroke} />
            <path d="M26 42h48" {...stroke} fill="none" />
            <path d="M26 60h28" {...stroke} fill="none" />
        </>
    );
}

function Pot() {
    // A level rising inside a circle — the same idea as the violet field behind
    // it, at mark scale, which is what makes a Piggy Pot's goal legible at a
    // glance without printing a number nobody can act on yet.
    return (
        <>
            <clipPath id="sp-mark-pot">
                <circle cx="50" cy="50" r="40" />
            </clipPath>
            <circle cx="50" cy="50" r="40" fill="none" {...stroke} />
            <g clipPath="url(#sp-mark-pot)">
                <path d="M10 60c13-11 27-11 40 0s27 11 40 0v34H10z" fill={YELLOW} />
                <path d="M10 60c13-11 27-11 40 0s27 11 40 0" fill="none" {...stroke} />
            </g>
        </>
    );
}

function Order() {
    // Two tiles, one in front: an order placed against a listing.
    return (
        <>
            <rect x="8" y="8" width="60" height="60" rx="16" fill="none" {...stroke} />
            <rect x="32" y="32" width="60" height="60" rx="16" fill={YELLOW} {...stroke} />
        </>
    );
}

function Purchases() {
    // A stack: the newest unlock on top, everything before it kept underneath.
    return (
        <>
            <rect x="8" y="14" width="84" height="24" rx="12" fill={YELLOW} {...stroke} />
            <rect x="8" y="48" width="84" height="16" rx="8" fill="none" {...stroke} />
            <rect x="8" y="74" width="84" height="16" rx="8" fill="none" {...stroke} />
        </>
    );
}

const MARKS = {
    piece: Piece,
    pot: Pot,
    order: Order,
    purchases: Purchases,
};

export default function SlideMark({ name, className = '' }) {
    const Shape = MARKS[name];

    // A slide whose mark key is wrong renders no artwork rather than throwing —
    // this sits in a first-launch overlay, where a crash is the whole app.
    if (!Shape) return null;

    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            role="presentation"
            aria-hidden="true"
            focusable="false"
        >
            <Shape />
        </svg>
    );
}
