import { useState } from "react";
import CategoryLeaders from "./CategoryLeaders";
import GrowthTrends from "./GrowthTrends";
import PlatformAnalytics from "./PlatformAnalytics";

/**
 * The three analytics panels, as one panel with three tabs.
 *
 * Stacked, they added roughly two screens of charts under a board most readers
 * came to scan — and the page already carried nine panels. They answer three
 * separate questions ("who leads each category", "who is moving", "how is the
 * platform doing"), so they are three views of one thing, not three things.
 *
 * ⚠️ Only the SELECTED panel is mounted. Each fetches from the shared bundle,
 * which is one cached response either way, but mounting all three also drew all
 * three charts on every page load.
 *
 * ⚠️ Each child hides its own heading here (`hideHeading`) — the tab already
 * names it, and a tab labelled "Categories" above a heading reading "🏆 Category
 * Leaders Creators" says the same thing twice and disagrees about the wording.
 */
const TABS = [
    { key: "categories", label: "Categories", Panel: CategoryLeaders },
    { key: "momentum", label: "Momentum", Panel: GrowthTrends },
    { key: "platform", label: "Platform", Panel: PlatformAnalytics },
];

export default function AnalyticsTabs() {
    const [active, setActive] = useState(TABS[0].key);
    const { Panel } = TABS.find((t) => t.key === active) ?? TABS[0];

    return (
        <section className="mb-10">
            <div
                role="tablist"
                aria-label="Leaderboard analytics"
                className="mb-4 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        role="tab"
                        aria-selected={active === tab.key}
                        onClick={() => setActive(tab.key)}
                        className={`min-h-[44px] whitespace-nowrap rounded-full border-black px-4 text-12 font-semibold uppercase tracking-[0.12em] transition-colors ${
                            active === tab.key
                                ? "bg-brandPink text-black"
                                : "bg-white text-black/70 hover:bg-black/[0.06] hover:text-black"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <Panel hideHeading />
        </section>
    );
}
