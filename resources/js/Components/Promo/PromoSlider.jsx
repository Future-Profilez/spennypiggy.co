import { useEffect, useMemo, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import { useReducedMotion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import "swiper/css";
import PromoCard from "./PromoCard";
import { isInstalled } from "@/lib/pwaInstall";
import { groundOf } from "./promoKit";
import PromoTimeline from "./PromoTimeline";

/**
 * The one place a promo is shown.
 *
 * 🚨 THE POINT OF THIS COMPONENT IS THAT IT RENDERS EXACTLY ONE CARD AT A TIME.
 * It replaces three always-on banners that stacked on the profile page above
 * "About me" — OfferAnnouncement, ReferralBanner and FeatureSuggestionBanner —
 * which is what made that page read as a noticeboard. Adding a promo means adding
 * an entry to `config/promos.php`, never a fourth banner beside this one.
 *
 * ⚠️ NOTHING HERE IS DISMISSIBLE, deliberately. The two banners it replaces hid
 * themselves for 14 and 20 days via localStorage, so a creator who closed one lost
 * the only route to that feature for a fortnight — there is no nav entry for
 * `/refer-and-earn` or the founder page anywhere in the app. A permanent slot that
 * costs one swipe to move past is the trade.
 */

/**
 * Weighted-random first card.
 *
 * A straight sort would mean the lowest-priority half of the deck is only ever
 * seen by someone who swipes, and most people do not. Weighting by priority keeps
 * the urgent card usually-first while giving every card a real chance of being the
 * one a creator lands on.
 */
function weightedIndex(promos) {
    const total = promos.reduce((sum, p) => sum + Math.max(1, p.priority), 0);
    let roll = Math.random() * total;

    for (let i = 0; i < promos.length; i += 1) {
        roll -= Math.max(1, promos[i].priority);
        if (roll <= 0) return i;
    }

    return 0;
}

/**
 * Reorders so no two cards sharing a ground colour sit next to each other.
 *
 * Two mint cards in a row makes a swipe look like it did nothing — the whole
 * design rests on the colour changing. Greedy and order-preserving otherwise, so
 * the deck still reads roughly high-priority first.
 */
function spreadColours(promos) {
    const pool = [...promos];
    const out = [];

    while (pool.length) {
        const previous = out.length ? groundOf(out[out.length - 1].ground).bg : null;
        let pick = pool.findIndex((p) => groundOf(p.ground).bg !== previous);

        if (pick === -1) pick = 0;
        out.push(pool.splice(pick, 1)[0]);
    }

    return out;
}

export default function PromoSlider({
    className = "",
    exclude = [],
    onSuggestFeature,
}) {
    const { promos } = usePage().props;
    const reduce = useReducedMotion();
    const [active, setActive] = useState(0);
    const swiperRef = useRef(null);

    const autoplayMs = promos?.autoplay_ms ?? 6000;

    /*
     * ⚠️ Ordered and picked ONCE per mount, not on every render — `Math.random()`
     * inside the render body would reshuffle the deck under the reader's thumb on
     * any unrelated state change.
     */
    /*
     * 🚨 THE INSTALL PROMO IS REMOVED INSIDE THE INSTALLED APP. Offering to install an
     * app to someone who is reading this FROM that app is the deck telling them
     * something untrue about their own device, and the button cannot work — there is no
     * install prompt to fire once the app is installed.
     *
     * ⚠️ Decided on the CLIENT, deliberately, and after mount. Standalone mode is a
     * display-mode media query the server cannot see, so `PromoBannerService` has no way
     * to filter it; and resolving it during render would differ between the first paint
     * and the hydrated one. Starting false means the card can appear for a frame in the
     * installed app — better than the reverse, which would hide it from everyone whose
     * browser answers the query late.
     */
    const [standalone, setStandalone] = useState(false);

    useEffect(() => setStandalone(isInstalled()), []);

    /*
     * ⚠️ `exclude` is how a page suppresses a card it is already showing in a
     * richer form — the profile passes `founder_bonus` while the creator's own
     * FounderProgressTracker is on screen. It is a display decision belonging to
     * the page, not an eligibility rule, which is why it is not in the service.
     */
    const deck = useMemo(
        () =>
            spreadColours(
                (promos?.banners ?? []).filter(
                    (p) =>
                        ! exclude.includes(p.key) &&
                        ! (standalone && p.action === "pwa_install"),
                ),
            ),
        [promos?.banners, exclude.join("|"), standalone],
    );
    const start = useMemo(
        () => (deck.length ? weightedIndex(deck) : 0),
        [deck],
    );

    useEffect(() => setActive(start), [start]);


    if (! deck.length) {
        return null;
    }

    const handleAction = (promo) => {
        if (promo.action === "suggest_feature") {
            onSuggestFeature?.();

            return;
        }

    };

    return (
        <section
            className={`w-full ${className}`}
            aria-label="What's on Spenny Piggy"
        >
            <Swiper
                modules={[Autoplay, A11y, Keyboard]}
                slidesPerView={1}
                spaceBetween={12}
                initialSlide={start}
                loop={deck.length > 2}
                keyboard={{ enabled: true }}
                /*
                 * ⚠️ `pauseOnMouseEnter` and `disableOnInteraction: false` together:
                 * the deck stops while someone is reading a card, and resumes after
                 * they swipe rather than freezing for the rest of the session.
                 * Autoplay is off entirely under reduced motion — an element that
                 * moves on its own is exactly what that setting asks us not to do.
                 */
                autoplay={
                    reduce || deck.length < 2
                        ? false
                        : {
                              delay: autoplayMs,
                              disableOnInteraction: false,
                              pauseOnMouseEnter: true,
                          }
                }
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => setActive(swiper.realIndex)}
            >
                {deck.map((promo) => (
                    <SwiperSlide key={promo.key}>
                        <PromoCard promo={promo} onAction={handleAction} />
                    </SwiperSlide>
                ))}
            </Swiper>

            <PromoTimeline
                promos={deck}
                active={active}
                autoplayMs={autoplayMs}
                animate={! reduce}
                onSelect={(i) => {
                    // `slideToLoop`, not `slideTo` — with loop on, Swiper's real
                    // indexes are offset by its duplicated slides, so `slideTo(2)`
                    // lands on the wrong card.
                    swiperRef.current?.slideToLoop
                        ? swiperRef.current.slideToLoop(i)
                        : swiperRef.current?.slideTo(i);
                }}
            />
        </section>
    );
}
