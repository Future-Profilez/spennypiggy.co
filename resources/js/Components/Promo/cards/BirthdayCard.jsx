import { CARD_FRAME, Chip, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Birthday Discovery — A WEEK, WITH ONE DAY THAT IS THEIRS.
 *
 * 🚨 This card exists because the feature was unreachable. Birthday Discovery is built end
 * to end — the opt-in, the three supporter reminders, the Monday campaign, the collection
 * page — and NOTHING told a creator any of it existed. The switch sits inside Creator
 * Studio on the account page, so it was found only by wandering through settings. No
 * opt-in means no place in the collection and none in the e-mail, so the feature has
 * nothing to show however correct the code is.
 *
 * 🚨 THIS FILE WAS WRITTEN AGAINST A `promoKit` CONTRACT THAT DOES NOT EXIST, and every
 * one of the four faults failed SILENTLY — it built clean, passed all four scanners and
 * the impeccable detector, and rendered as a pink card with unstyled type:
 *   · `ground: 'cream'` — there was no `cream` key, so `groundOf()` fell back to PINK.
 *   · `g.surface` — not a field on a ground; `${g.surface}` put the literal string
 *     "undefined" in the class list.
 *   · `g.ink` / `g.body` — these are HEX STRINGS, not class names. Used as `className`
 *     they are invalid classes and set no colour at all.
 *   · `display("sm")` — `display()` takes a full Tailwind size string, so this emitted the
 *     literal class `sm` and the headline had no size.
 * A ground is applied with an inline `backgroundColor`, and ink with an inline `color`,
 * exactly as the other ten cards do. **Read `promoKit.jsx` before writing a new card.**
 *
 * ⚠️ TWO EARLIER DRAWINGS WERE WRONG, EACH FOR A DIFFERENT REASON. A calendar leaf with an
 * empty date failed at WIDTH: the deck stretches a card past 800px and the leaf became a
 * full-width panel with two small dashed boxes floating in an empty field. Three numbered
 * reminder stages failed at DISTINCTNESS: `SuggestCard` already draws a numbered 1-2-3
 * list two slides away, and the house rule is explicit that a promo which could reuse
 * another card's body should be designed differently instead.
 *
 * ⚠️ A week strip is horizontal by nature, so it fills whatever width the deck gives it,
 * and no other card in the deck is a grid of cells. The cells ABUT, sharing hairlines,
 * which is the house `StatStrip` idiom.
 *
 * ⚠️ NO YEAR AND NO REAL DATE. The filled day is a position in a week, not a claim about
 * this creator — they have not set one yet, which is the entire point of the card. The
 * birth YEAR is never displayed anywhere on this platform.
 *
 * ⚠️ Shown only to a creator who has NOT opted in — see `PromoBannerService::isEligible`.
 */
export default function BirthdayCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    /* A week, as a strip. One day is theirs. */
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const theirs = 3;

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <div className="flex h-full flex-col px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <h3
                    className={`${display("mt-3 text-[26px] sm:text-[30px] md:text-[38px]")} max-w-[13ch]`}
                    style={{ color: g.ink }}
                >
                    Add your birthday
                </h3>

                <p
                    className="mt-2 max-w-[38ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold"
                    style={{ color: g.body }}
                >
                    Your supporters get reminded before the day — and you appear in the
                    birthday collection that week.
                </p>

                {/* The week strip: cells that abut, sharing hairlines, with one day filled. */}
                <div
                    aria-hidden="true"
                    className="mt-auto flex overflow-hidden rounded-box-sm"
                    style={{ border: "2px solid #000" }}
                >
                    {days.map((day, index) => (
                        <span
                            key={`${day}-${index}`}
                            className="flex flex-1 flex-col items-center gap-1 py-2"
                            style={{
                                backgroundColor: index === theirs ? accent : "#FFFFFF",
                                borderLeft: index === 0 ? "none" : "2px solid #000",
                            }}
                        >
                            <span className="font-CeraGR text-[9px] font-bold uppercase tracking-[0.1em] text-black/55">
                                {day}
                            </span>
                            <span className="font-gulfs text-[12px] leading-none text-black md:text-[14px]">
                                {index === theirs ? "★" : "·"}
                            </span>
                        </span>
                    ))}
                </div>

                <div className="mt-4">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
