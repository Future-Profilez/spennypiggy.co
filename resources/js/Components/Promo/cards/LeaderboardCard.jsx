import { CARD_FRAME, PAD, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Supporter wall — A LEADERBOARD, AND THE RULE IT RANKS BY.
 *
 * 🚨 THE ROWS SHOW RANK AND NOTHING ELSE — no amounts, no names. The real supporter
 * wall ranks by purchase COUNT and never by money (`UserProfileService::getPiggyPotTopSupporters()`
 * returns `purchases`, a COUNT, for exactly this reason), so a mock carrying a figure
 * would advertise a screen that does not exist. The explainer says so out loud, because
 * "leaderboard" otherwise reads as a spending contest, which is the thing it is not.
 */
export default function LeaderboardCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    const rows = [
        { n: "01", w: "86%", me: false },
        { n: "02", w: "62%", me: true },
        { n: "03", w: "40%", me: false },
    ];

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            <div className={`flex h-full flex-col ${PAD}`}>
                <h3 className={`${display("text-[24px] sm:text-[28px] md:text-[36px]")} max-w-[13ch]`} style={{ color: g.ink }}>
                    Your name on their wall
                </h3>

                <p className="mt-2 max-w-[38ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    Every creator page ranks its supporters by how many times they have
                    bought — never by how much they spent.
                </p>

                <div className="mt-auto space-y-1.5 pt-3" aria-hidden="true">
                    {rows.map((r) => (
                        <div key={r.n} className="flex items-center gap-2">
                            <span className="w-[22px] font-gulfs text-[13px] md:text-[15px]" style={{ color: g.ink }}>
                                {r.n}
                            </span>
                            <span
                                className="flex h-5 items-center rounded-box-xs md:h-6"
                                style={{ width: r.w, border: "2px solid #000", backgroundColor: r.me ? accent : "transparent" }}
                            >
                                {r.me && (
                                    <span className="pl-2 font-CeraGR text-[9px] md:text-[10px] uppercase tracking-[0.16em]" style={{ color: "#000" }}>
                                        You
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
