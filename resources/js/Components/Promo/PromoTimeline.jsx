import { groundOf } from "./promoKit";

/**
 * The deck's navigation — one segment per promo, each in that promo's own colour,
 * the active one filling like a timer while autoplay runs.
 *
 * ⚠️ This replaces dots, deliberately. A row of identical dots says only "there
 * are more of these"; a row of coloured segments says how many, which ones you
 * have seen, and — because the segment colour IS the card's ground — which one
 * you are about to land on. The fill is what makes the autoplay legible: without
 * it the deck advances for no visible reason and reads as broken.
 *
 * ⚠️ The fill animation is driven by a `key` that changes with the active index,
 * which is what restarts it. A CSS animation does not replay on a class change
 * alone, so remounting the element is the reliable way.
 *
 * ⚠️ Under reduced motion the fill is not animated — the active segment is simply
 * solid — and the slider does not autoplay, so there is nothing to count down.
 */
export default function PromoTimeline({
    promos,
    active,
    autoplayMs,
    animate,
    onSelect,
}) {
    if (promos.length < 2) {
        return null;
    }

    return (
        <div
            className="mt-3 flex items-center gap-1.5"
            role="tablist"
            aria-label="Promotions"
        >
            {promos.map((promo, i) => {
                const colour = groundOf(promo.ground).segment;
                const isActive = i === active;

                return (
                    <button
                        key={promo.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={promo.headline}
                        onClick={() => onSelect(i)}
                        /*
                         * ⚠️ The hit area is 24px tall and the visible bar is 6px
                         * inside it. A 6px-tall button is not a tappable target on
                         * a phone, and growing the bar to meet the thumb would
                         * turn a hairline rail into a block of colour.
                         */
                        className="group relative h-6 flex-1 min-w-0 px-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <span
                            className="absolute inset-x-0 top-[9px] h-1.5 rounded-box-xs border-2 border-[#000] overflow-hidden"
                            style={{
                                backgroundColor: isActive
                                    ? "transparent"
                                    : "#FFFFFF",
                            }}
                        >
                            <span
                                key={isActive ? `fill-${active}` : "idle"}
                                className="block h-full"
                                style={{
                                    backgroundColor: colour,
                                    width: "100%",
                                    animation:
                                        isActive && animate
                                            ? `promoFill ${autoplayMs}ms linear forwards`
                                            : undefined,
                                    opacity: isActive ? 1 : 0.4,
                                }}
                            />
                        </span>
                    </button>
                );
            })}

            <style>{`@keyframes promoFill { from { width: 0% } to { width: 100% } }`}</style>
        </div>
    );
}
