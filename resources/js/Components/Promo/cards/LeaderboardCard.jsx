import { CARD_FRAME, Chip, Cta, display, groundOf, accentOf } from "../promoKit";

/**
 * Supporter wall — A RANKING THAT SHOWS WHAT IT RANKS BY.
 *
 * ⚠️ The previous version drew three empty outlined pills of different lengths. Nothing
 * said what a length meant, no row carried a name or a number, and the result read as a
 * skeleton still loading rather than as a leaderboard. A ranking has to show the quantity
 * it sorts on or it is just three bars.
 *
 * 🚨 THE QUANTITY IS A PURCHASE COUNT, AND THERE IS NO MONEY ANYWHERE ON THIS CARD.
 * `UserProfileService::getPiggyPotTopSupporters()` returns `purchases` — a COUNT — and
 * never a sum, because ranking supporters by spend is exactly what the Stripe
 * content-first rule forbids. A mock showing an amount would advertise a screen that does
 * not exist and breach that rule in the same stroke. The column is labelled `PURCHASES`
 * so the number cannot be read as anything else.
 *
 * ⚠️ The other supporters are ANONYMOUS BARS, not invented names. A promo card is not the
 * place to put words in a real supporter's mouth, and the viewer's own row is the only one
 * the card is actually about.
 */
export default function LeaderboardCard({ promo, onAction }) {
    const g = groundOf(promo.ground);
    const accent = accentOf(promo.accent);

    const rows = [
        { rank: "01", name: null, count: 12, me: false },
        { rank: "02", name: "You", count: 9, me: true },
        { rank: "03", name: null, count: 7, me: false },
    ];

    /**
     * ⚠️ `compact` is the PHONE board, and it is a different board, not a scaled one.
     * The full version overran the 292px card by 48px; shrinking type would have made an
     * unreadable copy of the same thing. It drops to two rows (the leader and you — which
     * is the whole comparison), loses the avatars and the column header, and moves the
     * word "purchases" to a caption so the number still cannot be mistaken for money.
     */
    const Board = ({ compact = false }) => {
        const shown = compact ? rows.slice(0, 2) : rows;

        return (
            <div
                className="rounded-box-sm border-black p-1.5 sm:p-2 md:p-2.5"
                style={{ backgroundColor: "#FFFFFF" }}
            >
                {! compact && (
                    <div className="mb-1 flex items-center justify-between px-1 sm:mb-1.5">
                        <span className="font-CeraGR text-[7px] uppercase tracking-[0.16em] text-black/55 md:text-[8px]">
                            Supporter
                        </span>
                        <span className="font-CeraGR text-[7px] uppercase tracking-[0.16em] text-black/55 md:text-[8px]">
                            Purchases
                        </span>
                    </div>
                )}

                <div className="space-y-0.5 sm:space-y-1">
                    {shown.map((r) => (
                        <div
                            key={r.rank}
                            className="flex items-center gap-2 rounded-box-xs px-1.5 py-0.5 sm:py-1"
                            style={{
                                border: "2px solid #000",
                                backgroundColor: r.me ? accent : "#FFFFFF",
                            }}
                        >
                            <span className="w-[16px] shrink-0 font-gulfs text-[10px] text-black md:text-[11px]">
                                {r.rank}
                            </span>
                            {! compact && (
                                <span
                                    className="h-4 w-4 shrink-0 rounded-full md:h-[18px] md:w-[18px]"
                                    style={{ border: "2px solid #000", backgroundColor: r.me ? "#FFFFFF" : "#E9E4DA" }}
                                />
                            )}
                            {r.name ? (
                                <span className="min-w-0 flex-1 truncate font-CeraGR text-[10px] font-bold uppercase tracking-[0.12em] text-black md:text-[11px]">
                                    {r.name}
                                </span>
                            ) : (
                                /* An anonymous supporter: a bar where the name would be. */
                                <span className="h-2 flex-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.16)" }} />
                            )}
                            <span className="shrink-0 font-gulfs text-[12px] text-black sm:text-[13px] md:text-[15px]">
                                {r.count}
                            </span>
                        </div>
                    ))}
                </div>

                {compact && (
                    <p className="mt-1 px-1 text-right font-CeraGR text-[7px] uppercase tracking-[0.16em] text-black/55">
                        Purchases
                    </p>
                )}
            </div>
        );
    };

    return (
        <article className={CARD_FRAME} style={{ backgroundColor: g.bg }}>
            {/* ⚠️ `sm:` and up at a fixed width — a pixel-width panel inside a card
                narrower than it expects is what broke the install card at 320px. Below
                that the board ships in flow instead. */}
            <div className="pointer-events-none absolute right-5 top-1/2 hidden w-[236px] -translate-y-1/2 sm:block md:right-8 md:w-[300px]">
                <Board />
            </div>

            <div className="relative flex h-full w-full flex-col px-5 py-5 sm:w-[52%] sm:px-6 sm:py-6 md:px-8 md:py-7">
                <Chip g={g} accent={accent}>{promo.eyebrow}</Chip>

                <h3 className={`${display("mt-3 text-[21px] sm:text-[27px] md:text-[34px]")} max-w-[13ch]`} style={{ color: g.ink }}>
                    Your name on their wall
                </h3>

                <p className="mt-2 max-w-[32ch] text-[13px] md:text-[15px] leading-[1.4] font-semibold" style={{ color: g.body }}>
                    Ranked by how many times supporters bought — never by how much.
                </p>

                <div className="mt-2.5 sm:hidden">
                    <Board compact />
                </div>

                <div className="mt-auto pt-3">
                    <Cta promo={promo} g={g} onAction={onAction} />
                </div>
            </div>
        </article>
    );
}
