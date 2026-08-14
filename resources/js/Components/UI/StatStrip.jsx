import { ACCENT, TYPE } from './tokens';

/**
 * The signature object of the creator app: figures that ABUT.
 *
 * The hairline between two tiles is the black parent showing through a 1px gap,
 * never a border on each tile — adjacent borders double up and need a
 * per-position reset at every breakpoint. What that buys is the argument the
 * screen is making: a creator's money arrives from many places and is ONE
 * balance, so the figures read as one object made of parts rather than as a rail
 * of unrelated cards.
 *
 * It is the same device `home/WaysToGetPaid` and the Help Centre categories use.
 * Do not replace it with a gapped grid of `Panel`s.
 *
 * 🚨 No shadow, here or anywhere (client direction, 14 Aug 2026) — the frame is
 * the black border and the internal rules.
 *
 * Props:
 *   items  [{ label, value, sub, accent, Icon, href, key }]
 *   cols   tiles per row from md up (default 4); mobile is always 2
 *
 * ⚠️ AN ODD TILE COUNT MUST SPAN TWO COLUMNS on the last row, or the parent
 * shows through as a solid black block where the missing tile would be — which
 * reads as a rendering fault, not as a gap. Handled here so no caller has to
 * remember it.
 */

const COLS = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
};

/*
 * ⚠️ Written out longhand, never `md:col-span-${cols}`. Tailwind's JIT reads
 * literal class strings out of the source — an interpolated one emits NO CSS at
 * all, and the only symptom is the tile quietly not spanning, which looks like
 * the odd-count guard simply not working.
 */
const SPAN = {
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
};

export default function StatStrip({ items = [], cols = 4, className = '' }) {
    if (!items.length) return null;

    return (
        <div
            className={`grid grid-cols-2 ${COLS[cols] ?? COLS[4]} gap-px bg-black border-[3px] border-black rounded-box overflow-hidden ${className}`}
        >
            {items.map(({ key, ...item }, i) => (
                <Tile
                    /*
                     * ⚠️ `item.label ?? i` is not enough: a skeleton tile has an
                     * empty-string label, which is not nullish, so every one of
                     * them keyed to "" and React re-used a single node.
                     *
                     * ⚠️ And `key` is destructured OUT of the spread — React
                     * errors when a props object carrying `key` is spread into
                     * JSX, because the key is consumed as a prop and the element
                     * ends up with no key at all.
                     */
                    key={key || item.label || i}
                    {...item}
                    spanMobile={items.length % 2 === 1 && i === items.length - 1}
                    spanDesktop={items.length % cols === 1 && i === items.length - 1}
                    cols={cols}
                />
            ))}
        </div>
    );
}

function Tile({
    label,
    value,
    sub,
    accent = null,
    Icon = null,
    href = null,
    spanMobile = false,
    spanDesktop = false,
    cols = 4,
}) {
    const a = accent ? ACCENT[accent] : null;
    const Tag = href ? 'a' : 'div';

    return (
        <Tag
            href={href || undefined}
            className={[
                'bg-white p-4 md:p-5 flex flex-col justify-between min-h-[104px] md:min-h-[124px]',
                spanMobile ? 'col-span-2' : '',
                spanDesktop ? (SPAN[cols] ?? SPAN[4]) : 'md:col-span-1',
                href ? 'transition-colors duration-200 hover:bg-black/[0.04]' : '',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-2">
                <p className={`${TYPE.eyebrow} text-black/55`}>{label}</p>
                {Icon && (
                    <Icon
                        className={a ? a.text : 'text-black/30'}
                        size="1rem"
                        aria-hidden="true"
                    />
                )}
            </div>

            <div className="mt-3">
                <p
                    className={`${TYPE.figure} text-[26px] md:text-[32px]`}
                    style={a ? { color: a.hex } : undefined}
                >
                    {value}
                </p>
                {sub && (
                    <p className="mt-1 text-[12px] text-black/50 leading-[1.4]">
                        {sub}
                    </p>
                )}
            </div>
        </Tag>
    );
}

export { Tile as StatTile };
