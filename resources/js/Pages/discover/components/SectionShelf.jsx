/**
 * The shelf — Discover's ONE section header.
 *
 * 🚨 EVERY SECTION ON THIS PAGE USED TO DRAW ITS OWN HEADER. FeaturedCarousel
 * had one arrangement, the two inline sections another, ResultsGrid a third —
 * same ingredients, three geometries, which is why the page read as assembled
 * from parts even after the cards were unified.
 *
 * The signature is the SHELF RULE: a 2px black rule under the heading with the
 * count sitting on it as a yellow tag — the same price-tag vocabulary the cards
 * already speak. It encodes something true (this is a shelf; the tag says how
 * much is on it), which is what keeps it from being decoration.
 *
 * ⚠️ The rule is a `bg-black` div, never a border class — `border-black` is a
 * 2px SHORTHAND in this project and a one-side rule would need an inline style.
 */
export default function SectionShelf({ kicker, title, subtitle, count, action, className = '' }) {
    return (
        <div className={`mb-6 ${className}`}>
            {kicker && (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.18em] text-[#FF007F]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF007F]" />
                    {kicker}
                </span>
            )}

            <div className="mt-1 flex items-end justify-between gap-4">
                <h2 className="min-w-0 font-anton text-xl uppercase tracking-wide text-black sm:text-2xl md:text-3xl">
                    {title}
                </h2>
                {action && <div className="shrink-0 pb-1">{action}</div>}
            </div>

            {subtitle && (
                <p className="mt-1.5 max-w-xl text-[13px] font-medium leading-snug text-black/60">{subtitle}</p>
            )}

            <div className="relative mt-4 h-[2px] bg-black">
                {count != null && count !== '' && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 rounded-box-xs border-black bg-[#E6EA7B] px-2.5 py-0.5 text-[12px] font-black tabular-nums text-black">
                        {count}
                    </span>
                )}
            </div>
        </div>
    );
}
