import { Suspense, lazy, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import AddMoreTile from "@/Components/AddMoreTile";
import Nocontent from "@/includes/Nocontent";
import ItemBadges from "@/Components/ItemBadges";

const Popup = lazy(() => import("@/Components/Popup"));
const PiggyPotWidget = lazy(
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

    const content = useMemo(() => {
        if (piggyPots && piggyPots.length > 0) {
            return (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                                className={`text-left cursor-pointer ${inPopup ? "" : "bg-white border-[3px] border-black hover:-translate-y-1 rounded-box"} transition-all p-4 flex flex-col relative group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]`}
                            >
                                <div className="mb-3 rounded-box-sm overflow-hidden border-2 border-black h-[170px] flex-shrink-0 relative">
                                    <div className="absolute top-3 left-3 z-10">
                                        <span
                                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black  ${statusBadgeClass}`}
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
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        alt={pot.title}
                                    />
                                    {/* <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-16 h-10 bg-[#FF007F] rounded-full border-[3px] border-black flex items-center justify-center">
                                            <span className="text-black font-black text-3xl mb-1">
                                                +
                                            </span>
                                        </div>
                                    </div> */}
                                </div>
                                <ItemBadges
                                    createdAt={pot?.created_at}
                                    deadline={pot?.deadline}
                                    className="mb-1.5"
                                />
                                <h3 className="font-black text-xl uppercase tracking-wide text-black line-clamp-1">
                                    {pot.title}
                                </h3>
                                <p className="text-gray-600 text-sm font-medium line-clamp-2 mt-1 min-h-[40px] flex-grow">
                                    {pot.description}
                                </p>
                                {/* What the supporter gets back for funding the goal. */}
                                {(pot.reward_title ||
                                    pot.reward_description ||
                                    pot.content_description ||
                                    pot.content_file) && (
                                    <div className="mt-2 flex items-center gap-1.5 rounded-[20px] border border-emerald-600/25 bg-emerald-50 px-2.5 py-1.5">
                                        <Gift
                                            size={13}
                                            strokeWidth={2.5}
                                            className="shrink-0 text-emerald-600"
                                        />
                                        <span className="truncate text-[11px] font-bold leading-tight text-emerald-700">
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
                                    <span className="text-xs font-black text-gray-600 uppercase tracking-wider">
                                        Progress
                                    </span>
                                    <span className="font-black text-pink-600">
                                        {money(raised, pot.currency)} /{" "}
                                        {money(target, pot.currency)}
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-white h-4 md:h-5 rounded-full border-[3px] border-black overflow-hidden shadow-[inset_0_2px_0_rgba(0,0,0,0.1)]">
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
                    <div className="text-4xl mb-3">🐷</div>
                    <h3 className="font-gulfs text-2xl uppercase mb-2">
                        No Active Piggy Pots
                    </h3>
                    <p className="text-gray-600 font-bold mb-6">
                        Create a content goal to sell exclusive content toward a
                        visible progress goal.
                    </p>
                    <button
                        onClick={() =>
                            window.dispatchEvent(new Event("toggleAddOptions"))
                        }
                        className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black hover:-translate-y-1 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
                    >
                        Create Piggy Pot
                    </button>
                </div>
            );
        }

        return <Nocontent showdiscover={true} text="No active Piggy Pots." />;
    }, [IsloggedIn, piggyPots]);

    return (
        <>
            {content}
            <Suspense fallback={null}>
                <Popup
                    action={!!activePiggyPot}
                    space="6"
                    // classes="hidden"
                    // modalclass=""
                    // hidecontrols={true}
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
