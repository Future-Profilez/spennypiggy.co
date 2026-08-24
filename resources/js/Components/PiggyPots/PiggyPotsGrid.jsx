import { Suspense, useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import AddMoreTile from "@/Components/AddMoreTile";
import Nocontent from "@/includes/Nocontent";
import ItemBadges from "@/Components/ItemBadges";
import ItemStatusBadge from "@/Components/ItemStatusBadge";
import lazyRetry from "@/utils/lazyRetry";

const Popup = lazyRetry(() => import("@/Components/Popup"));
const PiggyPotWidget = lazyRetry(
    () => import("@/Components/PiggyPots/PiggyPotWidget"),
);

// Prices are shown in the pot's own currency — that is what the supporter is charged.
const money = (value, currency) =>
    new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: (currency || "GBP").toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const WidgetSkeleton = () => (
    <div className="w-full animate-pulse" aria-hidden="true">
        <div className="h-52 w-full rounded-box-sm border-[3px] border-black bg-gray-200" />
        <div className="mt-4 h-7 w-2/3 rounded-box-sm bg-gray-200" />
        <div className="mt-2 h-4 w-full rounded-box-sm bg-gray-100" />
        <div className="mt-6 h-12 w-full rounded-box-sm border-[3px] border-black bg-gray-200" />
    </div>
);

export default function PiggyPotsGrid({
    piggyPots,
    IsloggedIn,
    inPopup,
    user,
    global_currency,
    topSupporters,
    feed,
}) {
    const [activePiggyPot, setActivePiggyPot] = useState(null);

    /**
     * 🚨 `?pot={uuid}` OPENS THAT POT ON ARRIVAL. A Piggy Pot is the one sellable
     * type with no page of its own — it is bought through the widget this grid
     * opens as a popup — so without a deep link there is no way to send someone
     * to a SPECIFIC pot's checkout. The link-in-bio page's item cards rely on
     * this (`App\Support\BioSellableItems::checkoutUrl`), and building a second
     * pot checkout to avoid it would create a new Stripe surface, which is
     * exactly what that feature must not do.
     *
     * ⚠️ It only ever OPENS an existing widget. There is no new payment path
     * here: the popup, its risk checks, its price preview and its `piggy-pot.pay`
     * POST are the same ones a supporter reaches by tapping the tile.
     *
     * ⚠️ A uuid that is not in this creator's visible pots does nothing at all —
     * the parameter can only select from what the server already sent, so it can
     * never surface a pot the page was not allowed to show.
     *
     * ⚠️ Runs once per pot list, not on every render, and it does not rewrite the
     * URL: a supporter who closes the popup and refreshes expects the pot they
     * followed a link to, not an empty page.
     */
    useEffect(() => {
        if (typeof window === "undefined" || !piggyPots?.length) return;

        const wanted = new URLSearchParams(window.location.search).get("pot");

        if (!wanted) return;

        const match = piggyPots.find((p) => p?.uuid === wanted);

        if (match) setActivePiggyPot(match);
    }, [piggyPots]);

    const content = useMemo(() => {
        if (piggyPots && piggyPots.length > 0) {
            // Two columns on a phone, matching the wish, shop and bill grids.
            // Task and Membership are deliberately NOT on this rule (client
            // direction): a task card carries a delivery window and a membership
            // its tier art plus a perks list, neither survives a ~170px column.
            //
            // ⚠️ LINE comments, not a block one. A JSX-style brace comment placed
            // directly inside a `return (` is an object literal and breaks the
            // build — and writing that trap out inside a /* block */ closes the
            // comment early on its own terminator, which broke it a second way.
            // ⚠️ A ONE- OR TWO-ITEM GRID IS CAPPED, NOT STRETCHED. At `md:grid-cols-3`
            // a single pot rendered as a ~240px card alone in an ~800px column with
            // 560px of empty ground beside it — the only thing this creator has for
            // sale, drawn narrower than the card next to it. Fewer items keep the
            // same card size and the row simply stops being three wide.
            const gridCols =
                piggyPots.length === 1
                    ? "grid-cols-1 max-w-[320px]"
                    : piggyPots.length === 2
                      ? "grid-cols-2 max-w-[660px]"
                      : "grid-cols-2 md:grid-cols-3";

            return (
                <div className={`w-full grid ${gridCols} gap-2.5 sm:gap-4`}>
                    {piggyPots.map((pot) => {
                        const target = Number(pot?.target_amount) || 0;
                        const raised = Number(pot?.total_raised) || 0;
                        const progressPercent =
                            target > 0
                                ? Math.min(100, (raised / target) * 100)
                                : 0;
                        const remaining = Math.max(
                            0,
                            Number((target - raised).toFixed(2)),
                        );
                        const isComplete =
                            pot?.status === "completed" ||
                            remaining <= 0 ||
                            progressPercent >= 100;
                        const statusLabel = isComplete
                            ? "completed"
                            : pot?.status || "active";
                        const statusBadgeClass = isComplete
                            ? "bg-[#A2E4B8] text-black"
                            : statusLabel === "active"
                              ? "bg-[#A2E4B8] text-black"
                              : statusLabel === "moderation_hold"
                                ? "bg-red-200 text-black"
                                : "bg-gray-200 text-gray-800";

                        return (
                            <button
                                key={pot.id}
                                type="button"
                                onClick={() => setActivePiggyPot(pot)}
                                aria-label={`Open ${pot.title}`}
                                className={`text-left cursor-pointer ${inPopup ? "" : "bg-white border-[3px] border-black transition-colors duration-200 hover:bg-black/[0.03] rounded-box"} transition-all p-3 flex flex-col relative group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]`}
                            >
                                <div className="mb-3 rounded-box-sm overflow-hidden border-2 border-black h-[132px] sm:h-[170px] flex-shrink-0 relative">
                                    <div className="absolute top-3 left-3 z-10">
                                        <span
                                            className={`inline-flex items-center px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[12px] font-black uppercase tracking-widest border-2 border-black  ${statusBadgeClass}`}
                                        >
                                            {isComplete
                                                ? "✓ completed"
                                                : statusLabel}
                                        </span>
                                    </div>
                                    <img
                                        src={
                                            pot.cover_media ||
                                            "https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/"
                                        }
                                        className="w-full h-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]"
                                        alt={pot.title}
                                    />
                                </div>
                                <ItemBadges
                                    createdAt={pot?.created_at}
                                    deadline={pot?.deadline}
                                    className="mb-1.5"
                                />
                                <h3 className="font-black text-[13px] sm:text-xl uppercase tracking-wide text-black line-clamp-1">
                                    {pot.title}
                                </h3>

                                {/* The same chip the wish and bill cards use, so
                                    one moderation state reads one way across the
                                    whole profile. It also replaces a four-line
                                    inline block that, at two columns, was taller
                                    than the pot's own title and price. */}
                                {pot?.status === "moderation_hold" && (
                                    <div className="mt-1.5 flex">
                                        <ItemStatusBadge
                                            state="in_review"
                                            reason={pot?.moderation_reason}
                                            itemName={pot?.title}
                                            block={false}
                                        />
                                    </div>
                                )}

                                <p className="hidden sm:block text-gray-600 text-sm font-medium line-clamp-2 mt-1 sm:min-h-[40px] flex-grow">
                                    {pot.description}
                                </p>
                                {/* What the supporter gets back for funding the goal. */}
                                {(pot.reward_title ||
                                    pot.reward_description ||
                                    pot.content_description ||
                                    pot.content_file) && (
                                    <div className="mt-2 flex items-center gap-1.5 rounded-box border border-emerald-600/25 bg-emerald-50 px-2.5 py-1.5">
                                        <Gift
                                            size={13}
                                            strokeWidth={2.5}
                                            className="shrink-0 text-emerald-600"
                                        />
                                        <span className="truncate text-[12px] font-bold leading-tight text-emerald-700">
                                            <span className="text-emerald-600/80">
                                                You get:
                                            </span>{" "}
                                            {pot.reward_title ||
                                                pot.reward_description ||
                                                pot.content_description ||
                                                "Exclusive content"}
                                        </span>
                                    </div>
                                )}
                                <div className="mt-3 flex justify-between items-center flex-shrink-0">
                                   
                                    <span className="font-black text-[12px] sm:text-sm text-pink-600">
                                        {money(raised, pot.currency)} 
                                    </span>
                                    <span className="font-black text-[12px] sm:text-sm text-pink-600">
                                        {money(target, pot.currency)}
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-white h-4 md:h-5 rounded-full border-[3px] border-black overflow-hidden ">
                                    <div
                                        className={`${isComplete ? "bg-[#A2E4B8]" : "bg-[#FF007F]"} h-full transition-all duration-1000 ease-out`}
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                            </button>
                        );
                    })}

                    {IsloggedIn && (
                        <AddMoreTile
                            title="Add Piggy Pot"
                            subtitle="Create a new goal for your supporters."
                            onClick={() =>
                                window.dispatchEvent(
                                    new Event("toggleAddOptions"),
                                )
                            }
                            minHeightClass="min-h-[260px]"
                        />
                    )}
                </div>
            );
        }

        if (IsloggedIn) {
            return (
                <div className="w-full bg-white border-[3px] border-black rounded-box p-8 text-center mt-4">
                    <h3 className="font-gulfs text-2xl uppercase mb-2">
                        No active Piggy Pots
                    </h3>
                    <p className="text-gray-600 font-bold mb-6">
                        Create a content goal to sell exclusive content toward a
                        visible progress goal.
                    </p>
                    <button
                        onClick={() =>
                            window.dispatchEvent(new Event("toggleAddOptions"))
                        }
                        className="bg-[#FF007F] text-black uppercase text-lg px-8 py-2 rounded-full border-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
                    >
                        Create Piggy Pot
                    </button>
                </div>
            );
        }

        return (
            <Nocontent
                text="Nothing here yet"
                subheading="This creator has no content goals running."
            />
        );
    }, [IsloggedIn, piggyPots]);

    return (
        <>
            {content}
            <Suspense fallback={null}>
                <Popup
                    action={!!activePiggyPot}
                    space="6"
                    onHide={() => setActivePiggyPot(null)}
                >
                    {activePiggyPot && (
                        <div className="relative">
                            <Suspense fallback={<WidgetSkeleton />}>
                                <PiggyPotWidget
                                    inPopup={true}
                                    piggyPots={[activePiggyPot]}
                                    user={user}
                                    global_currency={global_currency}
                                    topSupporters={topSupporters}
                                    feed={feed}
                                />
                            </Suspense>
                        </div>
                    )}
                </Popup>
            </Suspense>
        </>
    );
}
