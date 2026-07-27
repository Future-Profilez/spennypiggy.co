import { Sparkles, Flame, Clock } from "lucide-react";

const NEW_DAYS = 7;

const daysSince = (value) => {
    if (!value) return null;
    const t = new Date(String(value).replace(" ", "T")).getTime();
    if (Number.isNaN(t)) return null;

    return (Date.now() - t) / 86400000;
};

const daysUntil = (value) => {
    if (!value) return null;
    const t = new Date(String(value).replace(" ", "T")).getTime();
    if (Number.isNaN(t)) return null;

    return (t - Date.now()) / 86400000;
};

const chip =
    "inline-flex items-center gap-1 rounded-full border-2 border-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider";

/**
 * Honest urgency, read from columns the item already carries — nothing here is a
 * marketing flag someone can switch on. `stock` is remaining units (the server
 * decrements it per sale), so "Only N left" and "Sold out" are literally true.
 */
export default function ItemBadges({
    createdAt,
    stock,
    deadline,
    className = "",
}) {
    const age = daysSince(createdAt);
    const isNew = age !== null && age <= NEW_DAYS;

    const left = stock === null || stock === undefined ? null : Number(stock);
    const soldOut = left !== null && left <= 0;
    const lowStock = left !== null && left > 0 && left <= 3;

    const endsIn = daysUntil(deadline);
    const endingSoon = endsIn !== null && endsIn > 0 && endsIn <= 3;

    if (!isNew && !soldOut && !lowStock && !endingSoon) return null;

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {soldOut ? (
                <span className={`${chip} bg-black text-white`}>Sold out</span>
            ) : (
                <>
                    {isNew && (
                        <span className={`${chip} bg-[#A2E4B8] text-black`}>
                            <Sparkles size={10} strokeWidth={3} />
                            New
                        </span>
                    )}
                    {lowStock && (
                        <span className={`${chip} bg-[#FF007F] text-white`}>
                            <Flame size={10} strokeWidth={3} />
                            Only {left} left
                        </span>
                    )}
                    {endingSoon && (
                        <span className={`${chip} bg-[#FFE600] text-black`}>
                            <Clock size={10} strokeWidth={3} />
                            {endsIn < 1
                                ? "Ends today"
                                : `${Math.ceil(endsIn)} day${Math.ceil(endsIn) === 1 ? "" : "s"} left`}
                        </span>
                    )}
                </>
            )}
        </div>
    );
}
