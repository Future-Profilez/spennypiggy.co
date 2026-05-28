import { Suspense, lazy, useMemo, useState } from "react";
import AddMoreTile from "@/Components/AddMoreTile";
import Nocontent from "@/includes/Nocontent";

const Popup = lazy(() => import("@/Components/Popup"));
const PiggyPotWidget = lazy(() => import("@/Components/PiggyPots/PiggyPotWidget"));

export default function PiggyPotsGrid({
    piggyPots,
    IsloggedIn, inPopup,
    user,
    global_currency,
    topSupporters,
    feed,
}) {
    const [activePiggyPot, setActivePiggyPot] = useState(null);

    const content = useMemo(() => {
        if (piggyPots && piggyPots.length > 0) {
            return (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {piggyPots.map((pot) => {
                        const target = Number(pot?.target_amount) || 0;
                        const raised = Number(pot?.total_raised) || 0;
                        const progressPercent =
                            target > 0
                                ? Math.min(100, (raised / target) * 100)
                                : 0;
                        const remaining = Math.max(0, Number((target - raised).toFixed(2)));
                        const isComplete = pot?.status === 'completed' || remaining <= 0 || progressPercent >= 100;
                        const statusLabel = isComplete ? 'completed' : (pot?.status || 'active');
                        const statusBadgeClass = isComplete
                            ? 'bg-[#FFD700] text-black'
                            : statusLabel === 'active'
                                ? 'bg-[#A2E4B8] text-black'
                                : statusLabel === 'moderation_hold'
                                    ? 'bg-red-200 text-black'
                                    : 'bg-gray-200 text-gray-800';

                        return (
                            <div key={pot.id} onClick={() => setActivePiggyPot(pot)} className={`cursor-pointer ${inPopup ? '' : "bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 rounded-[30px] "} transition-all p-4 flex flex-col relative group`}>
                                <div className="mb-3 rounded-[20px] overflow-hidden border-2 border-black h-[170px] flex-shrink-0 relative">
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${statusBadgeClass}`}>
                                            {isComplete ? '✓ completed' : statusLabel}
                                        </span>
                                    </div>
                                    <img src={pot.cover_media || "https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    alt={pot.title} />
                                    {/* <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-16 h-10 bg-[#e85d9a] rounded-full border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <span className="text-black font-black text-3xl mb-1">
                                                +
                                            </span>
                                        </div>
                                    </div> */}
                                </div>
                                <h3 className="font-black text-xl uppercase tracking-wide text-black line-clamp-1">
                                    {pot.title}
                                </h3>
                                <p className="text-gray-600 text-sm font-medium line-clamp-2 mt-1 min-h-[40px] flex-grow">
                                    {pot.description}
                                </p>
                                <div className="mt-3  flex justify-between items-center flex-shrink-0">
                                    <span className="text-xs font-black text-gray-600 uppercase tracking-wider">
                                        Target
                                    </span>
                                    <span className="font-black text-pink-600">
                                        {pot.currency} {pot.target_amount}
                                    </span>
                                </div>
                                <div className="mt-2 w-full bg-white h-4 md:h-5 rounded-full border-[3px] border-black overflow-hidden  shadow-[inset_0_2px_0_rgba(0,0,0,0.1)]">
                                    <div
                                        className={`${isComplete ? 'bg-[#FFD700]' : 'bg-[#e85d9a]'} h-full transition-all duration-1000 ease-out`}
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                            </div>
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
                <div className="w-full bg-white border-[3px] border-black rounded-[30px]  p-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
                    <div className="text-4xl mb-3">🐷</div>
                    <h3 className="font-gulfs text-2xl uppercase mb-2">
                        No Active Piggy Pots
                    </h3>
                    <p className="text-gray-600 font-bold mb-6">
                        Create a Piggy Pot to let your fans fund your next big
                        goal or purchase.
                    </p>
                    <button
                        onClick={() =>
                            window.dispatchEvent(new Event("toggleAddOptions"))
                        }
                        className="bg-[#FF007F] text-black text-white uppercase text-lg px-8 py-2 rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
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
                            <Suspense fallback={null}>
                                <PiggyPotWidget inPopup={true}
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
