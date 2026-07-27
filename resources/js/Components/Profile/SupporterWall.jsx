import { usePage } from "@inertiajs/react";
import { Clock, ShieldCheck, Zap } from "lucide-react";

const initial = (name) => (name || "?").trim().charAt(0).toUpperCase();

/**
 * Two things a visitor weighs before paying: is anyone else here, and does this
 * creator actually deliver. Both are read straight from the ledger and the
 * deliverables table — nothing here is a claim the creator wrote about itself.
 *
 * Supporters are labelled by PURCHASE COUNT, never by amount (Stripe compliance:
 * a most-active board, not a spend race).
 */
export default function SupporterWall() {
    const { social_proof: proof } = usePage().props;

    const supporters = proof?.supporters || [];
    const delivery = proof?.delivery;
    const active = proof?.supporters_30d || 0;

    const medianLabel =
        delivery?.median_hours === null || delivery?.median_hours === undefined
            ? null
            : delivery.median_hours < 1
              ? "Instantly"
              : delivery.median_hours < 48
                ? `~${Math.round(delivery.median_hours)}h`
                : `~${Math.round(delivery.median_hours / 24)} days`;

    const showDelivery = delivery && delivery.total >= 3;

    if (!supporters.length && !showDelivery) return null;

    return (
        <div className="rounded-box border border-black/10 bg-white p-4 shadow-none sm:p-5 md:border-2 md:border-black">
            {supporters.length > 0 && (
                <>
                    <div className="mb-3 flex items-baseline justify-between gap-2">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-black">
                            Recent supporters
                        </h3>
                        {active > 0 && (
                            <span className="text-[11px] font-bold text-gray-500">
                                {active} active this month
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {supporters.map((s, i) => (
                            <a
                                key={s.username || i}
                                href={s.username ? `/${s.username}` : undefined}
                                title={`${s.name} — ${s.purchases} purchase${s.purchases === 1 ? "" : "s"}`}
                                className="group relative block"
                            >
                                {s.avatar ? (
                                    <img
                                        src={s.avatar}
                                        alt={s.name}
                                        className="!h-11 !w-11 !min-h-0 rounded-full border-2 border-black object-cover transition-transform group-hover:-translate-y-0.5"
                                    />
                                ) : (
                                    <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-black bg-[#FFE600] text-sm font-black transition-transform group-hover:-translate-y-0.5">
                                        {initial(s.name)}
                                    </span>
                                )}
                                {s.purchases > 1 && (
                                    <span className="absolute -bottom-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-black bg-[#FF007F] px-1 text-[9px] font-black leading-none text-white">
                                        {s.purchases}
                                    </span>
                                )}
                                {s.vip?.level && (
                                    <span
                                        className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-black"
                                        style={{ background: s.vip.color || "#FFD700" }}
                                        title={s.vip.level}
                                    />
                                )}
                            </a>
                        ))}
                    </div>
                </>
            )}

            {showDelivery && (
                <div
                    className={`${supporters.length ? "mt-4 border-t border-black/10 pt-4" : ""} space-y-2.5`}
                >
                    <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-black">
                        Delivery record
                    </h3>

                    {medianLabel && (
                        <div className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#A2E4B8]/40 text-[#0F7B45]">
                                {medianLabel === "Instantly" ? (
                                    <Zap size={14} strokeWidth={2.5} />
                                ) : (
                                    <Clock size={14} strokeWidth={2.5} />
                                )}
                            </span>
                            <span>
                                Usually delivers{" "}
                                <span className="font-black text-black">
                                    {medianLabel.toLowerCase()}
                                </span>
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2.5 text-[13px] font-semibold text-gray-700">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF007F]/10 text-[#FF007F]">
                            <ShieldCheck size={14} strokeWidth={2.5} />
                        </span>
                        <span>
                            <span className="font-black text-black">{delivery.total}</span>{" "}
                            delivered
                            {delivery.on_time !== null &&
                                delivery.on_time_of > 0 && (
                                    <>
                                        {" · "}
                                        <span className="font-black text-black">
                                            {delivery.on_time}/{delivery.on_time_of}
                                        </span>{" "}
                                        on time
                                    </>
                                )}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
