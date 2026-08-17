import Panel from './Panel';
import { TYPE } from './tokens';

/**
 * A list whose rows abut, sharing hairlines inside one frame.
 *
 * The same argument as `StatStrip`, at list scale: these things belong to each
 * other, so they are one object with rules between them rather than a stack of
 * floating cards. It also removes the biggest source of visual noise on the old
 * creator screens, where every transaction was its own bordered, shadowed card.
 *
 * ⚠️ `divide-y`, never a border per child — adjacent borders double up and need
 * a first/last reset at every breakpoint.
 */
export default function RowGroup({
    accent = null,
    emphasis = 'normal',
    className = '',
    children,
}) {
    return (
        <Panel
            pad="none"
            accent={accent}
            emphasis={emphasis}
            className={`overflow-hidden ${className}`}
        >
            <div className="divide-y divide-black/10">{children}</div>
        </Panel>
    );
}

/**
 * One row.
 *
 * Props:
 *   lead      node pinned left at its natural size — an avatar, a rank, an icon
 *   title     the thing being listed
 *   meta      ONE wrapping line under the title
 *   figure    the number, pinned right
 *   figureSub small line under the figure
 *   trailing  node after the figure (a chevron, a menu)
 *   onClick / href make the whole row activate
 *
 * 🚨 THE RIGHT-HAND COLUMN MUST HAVE A WIDTH OF ITS OWN. An unconstrained right
 * column is what broke these rows on a phone: at 390px the amount and its label
 * broke mid-phrase ("Last 3 / months") while the creator's NAME truncated beside
 * a handle that still fitted in full. The figure is `shrink-0 whitespace-nowrap
 * tabular-nums`; the title side gets `min-w-0` so it is the part that truncates.
 *
 * 🚨 The row is at least 44px of tap target when it is interactive. A row small
 * enough to look tidy and small enough to miss is worse than a plain one — take
 * the size off the padding and the type, never off the minimum height.
 */
export function Row({
    lead = null,
    title,
    meta = null,
    figure = null,
    figureSub = null,
    trailing = null,
    href = null,
    onClick = null,
    className = '',
    children = null,
}) {
    const interactive = Boolean(href || onClick);
    const Tag = href ? 'a' : onClick ? 'button' : 'div';

    return (
        <Tag
            href={href || undefined}
            onClick={onClick || undefined}
            type={Tag === 'button' ? 'button' : undefined}
            className={[
                'w-full text-left flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 min-h-[56px]',
                interactive
                    ? 'transition-colors duration-200 hover:bg-black/[0.04]'
                    : '',
                className,
            ].join(' ')}
        >
            {lead && <div className="shrink-0">{lead}</div>}

            <div className="min-w-0 flex-1">
                <p className="font-gulfs uppercase text-[14px] md:text-[15px] leading-[1.2] truncate">
                    {title}
                </p>
                {meta && (
                    <p className="mt-1 text-[12px] text-black/55 leading-[1.4]">
                        {meta}
                    </p>
                )}
                {children}
            </div>

            {figure !== null && (
                <div className="shrink-0 text-right">
                    <p
                        className={`${TYPE.figure} text-[16px] md:text-[18px] whitespace-nowrap`}
                    >
                        {figure}
                    </p>
                    {figureSub && (
                        <p className="mt-0.5 text-[11px] text-black/50 whitespace-nowrap">
                            {figureSub}
                        </p>
                    )}
                </div>
            )}

            {trailing && <div className="shrink-0">{trailing}</div>}
        </Tag>
    );
}
