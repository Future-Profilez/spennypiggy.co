import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

/**
 * The shared grammar of the `/creators/*` paid-ads pages.
 *
 * 🚨 THESE PAGES RENDER IN THE LANDING PAGE'S SYSTEM, NOT A SYSTEM OF THEIR OWN
 * (client direction, 12 Aug 2026). They used to be a flat mint page carrying a
 * grid of white boxes, which broke the home page's own load-bearing rule —
 * `PageCanvas`'s docblock: "Do NOT give a section its own background colour. It
 * will cut this field in half… Solid colour belongs on BLOCKS inside a section,
 * never on the section itself."
 *
 * So: one dark field behind the whole page, sections transparent, and every
 * solid colour lives on a block sitting on top of it. Type follows the home
 * page exactly — `font-gulfs` uppercase white headings with `text-gradient-
 * wishlist` on the phrase that carries the argument, `text-gray-300` body at
 * `text-base md:text-xl`, and the pink pill CTA with its "It's free" tag.
 *
 * What survives from the previous pass is the STRUCTURE, because the client kept
 * it: claims are set as statement rows that ABUT — sharing hairlines inside one
 * white block rather than floating as separate cards — so the group reads as one
 * object made of parts, which is the thesis: many sources, one income. That is
 * also how the home page's own `WaysToGetPaid` is built, so it was already the
 * house device; these pages just were not using it.
 *
 * ⚠️ One accent per page, and it encodes which half of the argument the page is
 * making rather than decorating it: mint = money coming in, pink = money staying
 * safe, violet = money paid on top. The overview carries all three, once each.
 * Six accents would be no accent.
 */

/**
 * The page accents, named for what they mean.
 *
 * ⚠️ These are the home page's own three — `#05EFB8`, `#FF007F`, `#8C52FF` —
 * not a palette invented for this section. `PricingSection` uses the same three
 * on its three figures.
 */
export const ACCENT = {
    /** Money coming in — the earning pages. */
    earn: '#05EFB8',
    /** Money staying safe — the protection pages. */
    safe: '#FF007F',
    /** Money paid on top — the bonus pages. */
    bonus: '#8C52FF',
};

/**
 * A white block whose children abut, sharing hairlines.
 *
 * `divide-y` rather than a border per child: adjacent borders double up and need
 * a per-position reset at every breakpoint, which is how a "tidy" grid ends up
 * with one rule twice as thick as its neighbours.
 */
export function LedgerFrame({ children, className = '' }) {
    return (
        <div
            className={`overflow-hidden rounded-box border-2 border-black bg-white ${className}`}
        >
            <div className="divide-y-2 divide-black">{children}</div>
        </div>
    );
}

/** One statement line: what it is, what it does, what it comes to. */
export function LedgerRow({ mark, title, line, figure, tag, accent }) {
    return (
        <div className="flex items-start gap-4 px-5 py-5 md:gap-6 md:px-8 md:py-6">
            {mark && (
                <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-box-sm border-2 border-black text-xl md:h-12 md:w-12 md:text-2xl"
                    style={{ backgroundColor: accent }}
                    aria-hidden="true"
                >
                    {mark}
                </div>
            )}

            <div className="min-w-0 flex-1">
                <h3 className="font-gulfs text-base uppercase leading-tight tracking-wide text-black md:text-lg">
                    {title}
                </h3>
                {line && (
                    <p className="mt-1.5 text-sm leading-relaxed text-black/80 md:text-base">
                        {line}
                    </p>
                )}
            </div>

            {(figure || tag) && (
                <div className="shrink-0 text-right">
                    {figure && (
                        <div className="font-gulfs text-base uppercase tabular-nums text-black md:text-lg">
                            {figure}
                        </div>
                    )}
                    {tag && (
                        <div className="mt-1 font-gulfs text-[12px] uppercase tracking-[0.18em] text-black/60">
                            {tag}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * The foot of a block — where a statement puts its total.
 *
 * Inverted, because it is the line the reader is meant to land on, and it is the
 * only filled row in a frame. `WaysToGetPaid` does the same thing with its
 * payout terminus for the same reason.
 */
export function LedgerTotal({ label, figure, note }) {
    return (
        <div className="flex items-center justify-between gap-4 bg-black px-5 py-5 md:px-8 md:py-6">
            <div>
                <div className="font-gulfs text-[12px] uppercase tracking-[0.2em] text-white/60">
                    {label}
                </div>
                {note && (
                    <div className="mt-1.5 text-sm text-gray-300 md:text-base">
                        {note}
                    </div>
                )}
            </div>
            <div className="shrink-0 font-gulfs text-2xl uppercase text-white md:text-3xl">
                {figure}
            </div>
        </div>
    );
}

/**
 * The section eyebrow — the home page's exact treatment.
 *
 * `font-gulfs uppercase tracking-[0.22em]` in the section's accent, which is
 * what `Hero` and `PricingSection` both use. The previous version was a mono
 * label beside a coloured rule, which was a device this site does not have.
 */
export function Eyebrow({ children, accent, className = '' }) {
    return (
        <span
            className={`block font-gulfs text-[13px] uppercase tracking-[0.22em] md:text-sm ${className}`}
            style={{ color: accent }}
        >
            {children}
        </span>
    );
}

/**
 * A figure and its label.
 *
 * Mirrors `home/PricingSection`'s figure row: the number leads in the display
 * face, the label sits under it, and the accent is carried by a short rule
 * rather than by tinting the type — which is what keeps three of them legible
 * side by side on a dark field.
 */
export function StatCell({ figure, label, note, accent, className = '' }) {
    return (
        <div className={`px-5 py-6 md:px-8 md:py-8 ${className}`}>
            {accent && (
                <span
                    className="mb-5 block h-[5px] w-10 rounded-full"
                    style={{ backgroundColor: accent }}
                />
            )}
            <div className="font-gulfs text-3xl uppercase leading-none text-white md:text-5xl">
                {figure}
            </div>
            <div className="mt-3 font-gulfs text-[12px] uppercase tracking-[0.18em] text-white/60">
                {label}
            </div>
            {note && (
                <p className="mt-2.5 text-sm leading-relaxed text-gray-300 md:text-base">
                    {note}
                </p>
            )}
        </div>
    );
}

/**
 * The one call to action — the home page's hero button, verbatim in treatment.
 *
 * ⚠️ Pink pill, white uppercase, `rounded-full`, with the white "It's free" tag
 * pinned to its corner. Every page carried its own yellow-bordered button with
 * the wording retyped three or four times; one component means the button, the
 * tag and the promise line cannot drift between the hero and the foot of the
 * same page.
 */
export function StartSelling({ promise, align = 'left', className = '' }) {
    return (
        <div
            className={`flex flex-col gap-4 ${align === 'center' ? 'items-center text-center' : 'items-start'} ${className}`}
        >
            <div className="relative inline-block">
                <Link
                    href="/register"
                    className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#FF007F] px-7 py-3 min-h-[52px] text-base font-black uppercase tracking-wide text-black transition-[filter,opacity] duration-300 active:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 md:px-9 md:text-xl">
                    <span className="relative z-10">Start selling</span>
                    <ArrowRight
                        size={22}
                        className="relative z-10 transition-transform group-hover:translate-x-1"
                    />
                    <span className="absolute inset-0 bg-gradient-to-r from-[#E6EA7B] via-[#FF007F] to-[#05EFB8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </Link>
                <span className="absolute -right-3 -top-4 rounded-full bg-white px-3 py-1 font-gulfs text-[12px] uppercase tracking-[0.18em] text-[#FF007F]">
                    It's free
                </span>
            </div>

            <p className="max-w-[560px] font-gulfs text-[12px] uppercase leading-relaxed tracking-[0.1em] text-white/70">
                {promise}
            </p>
        </div>
    );
}

/**
 * A section heading in the landing page's voice.
 *
 * ⚠️ `text-gradient-wishlist` carries ONE phrase per heading — the one the
 * argument turns on. Applying it to the whole line is how a page ends up with
 * six gradient headings and no emphasis anywhere.
 */
export function SectionHead({ eyebrow, accent, children, lead, className = '' }) {
    return (
        <div className={className}>
            {eyebrow && <Eyebrow accent={accent}>{eyebrow}</Eyebrow>}
            <h2 className="mt-4 max-w-2xl font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                {children}
            </h2>
            {lead && (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 md:text-xl">
                    {lead}
                </p>
            )}
        </div>
    );
}
