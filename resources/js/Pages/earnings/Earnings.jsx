import { Head, usePage } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import PriceFormat from "@/includes/PriceFormat";
import RefreshRecordsButton from "@/Components/RefreshRecordsButton";
import TopEarnWishes from "./TopEarnWishes";
import TopEarnPiggyPots from "./TopEarnPiggyPots";
import TopEarnShop from "./TopEarnShop";
import TopEarnMemberships from "./TopEarnMemberships";
import TopEarnBills from "./TopEarnBills";
import TopSupporters from "./TopSupporters";
import MonthlyRevenue from "./MonthlyRevenue";
import PaidTask from "./PaidTask";
import ReserveWidget from "@/Components/Creator/ReserveWidget";
import StatStrip from "@/Components/UI/StatStrip";
import SectionHead from "@/Components/UI/SectionHead";
import { ACCENT, TYPE } from "@/Components/UI/tokens";

const PERIODS = [
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "all", label: "All time" },
];

export default function Earnings(props) {
    const { formatMultiPrice } = PriceFormat();
    const { auth, global_currency } = usePage().props;

    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isChanging, setIsChanging] = useState(false);
    const [earnType, setEarnType] = useState("all");

    const handleEarnings = (type) => {
        if (type === earnType) return;
        setIsChanging(true);
        setEarnType(type);
    };

    const fetchingStats = () => {
        setLoading(true);
        axios
            .get(`/earnings/all-data/${earnType}`)
            .then((resp) => {
                setLists(resp.data.earnings);
                setLoading(false);
                setTimeout(() => setIsChanging(false), 300);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
                setIsChanging(false);
            });
    };

    useEffect(() => {
        fetchingStats();
    }, [earnType]);

    const busy = loading || isChanging;
    const currency = global_currency || auth?.user?.default_currency || "gbp";

    const grossTotal = Array.isArray(lists)
        ? lists.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
        : 0;

    /*
     * Every income stream is a tile in ONE joined strip rather than its own
     * bordered card. That is the argument the page is making: a creator earns
     * from several places and it is one income — the same device the landing
     * page's "ways to get paid" section uses, for the same reason.
     *
     * ⚠️ The skeleton keeps the same tile count and the same frame, so the page
     * does not reflow when the figures land.
     */
    const streamTiles = busy
        ? Array.from({ length: 4 }, (_, i) => ({
              label: "",
              value: (
                  <span className="block h-7 w-24 rounded bg-black/10 animate-pulse" />
              ),
              sub: null,
              key: `skeleton-${i}`,
          }))
        : (Array.isArray(lists) ? lists : []).map((row) => ({
              label: row.title,
              value: formatMultiPrice(row?.amount, currency),
              sub: row.percent > 0 ? `${row.percent}% of income` : null,
          }));

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title="Earnings" />

            {/* ── The one statement: what this creator has earned ────────── */}
            <header className="bg-[#0B0B0C] pt-10 pb-12">
                <div className="containerbox">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
                        <div className="max-w-xl">
                            <p
                                className={`${TYPE.eyebrow} mb-3`}
                                style={{ color: ACCENT.mint.hex }}
                            >
                                Your earnings
                            </p>
                            <h1
                                className={`${TYPE.display} text-white text-[30px] md:text-[42px] leading-[0.95]`}
                            >
                                Everything you
                                <br className="hidden md:block" /> have earned
                            </h1>
                            {/*
                             * ⚠️ This paragraph, the two figures in the strip below and the
                             * period buttons were all `text-black/60` on this black band —
                             * five places rendering invisible text on the live page.
                             */}
                            <p className="mt-3 text-[15px] leading-[1.55] text-white/60">
                                Across every way you sell. Money you have been
                                paid, money still clearing, all of it.
                            </p>
                            <a
                                href="/financial/dashboard"
                                className="mt-4 inline-flex items-center gap-2 font-gulfs uppercase tracking-[0.1em] text-[12px] text-white transition-opacity duration-200 hover:opacity-70"
                                style={{ color: ACCENT.mint.hex }}
                            >
                                Financial dashboard
                                <span aria-hidden="true">→</span>
                            </a>
                        </div>

                        <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col lg:items-end gap-3">
                            {/*
                             * The period control is the house frame in miniature: one black
                             * box, the selected period filled. It was a pill rail whose
                             * unselected labels were black on black.
                             */}
                            <div className="grid grid-cols-4 gap-px bg-black border-[3px] border-black rounded-box-sm overflow-hidden">
                                {PERIODS.map((p) => {
                                    const active = earnType === p.key;
                                    return (
                                        <button
                                            key={p.key}
                                            type="button"
                                            onClick={() =>
                                                handleEarnings(p.key)
                                            }
                                            disabled={busy}
                                            aria-pressed={active}
                                            className={[
                                                "min-h-[44px] px-3 md:px-4 font-gulfs uppercase tracking-[0.08em] text-[11px] md:text-[12px] leading-none",
                                                "transition-colors duration-200 disabled:opacity-60",
                                                active
                                                    ? "text-black"
                                                    : "bg-[#15161C] text-white/70 hover:bg-[#1E2029]",
                                            ].join(" ")}
                                            style={
                                                active
                                                    ? {
                                                          backgroundColor:
                                                              ACCENT.mint.hex,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {p.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/*
                             * ⚠️ Only frame and colour here — the component already
                             * sets its own `min-h-[44px]`, `text-sm`, `font-poppins`
                             * and `rounded-box-sm`, and a second value for any of
                             * those is a conflicting-utility pair that
                             * `npm run check` fails the build on. Which one wins is
                             * decided by stylesheet order, not by source order.
                             */}
                            <RefreshRecordsButton className="w-full sm:w-auto border-[3px] border-black bg-[#15161C] uppercase tracking-[0.08em] text-white hover:bg-[#1E2029]" />
                        </div>
                    </div>

                    {/* The total, and the two facts that qualify it, as one object. */}
                    <div
                        className={`grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-px bg-white/12 border-[3px] border-black rounded-box overflow-hidden transition-opacity duration-300 ${
                            isChanging ? "opacity-60" : "opacity-100"
                        }`}
                    >
                        <div className="bg-[#15161C] p-5 md:p-7">
                            <p className={`${TYPE.eyebrow} text-white/55`}>
                                Total earned
                            </p>
                            {busy ? (
                                <div className="mt-3 h-12 w-56 rounded bg-white/10 animate-pulse" />
                            ) : (
                                <p
                                    className={`${TYPE.figure} mt-3 text-white text-[40px] md:text-[60px]`}
                                >
                                    {formatMultiPrice(grossTotal, currency)}
                                </p>
                            )}
                        </div>

                        <Fact
                            label="Active streams"
                            value={lists?.length || 0}
                        />
                        <Fact
                            label="Currency"
                            value={currency.toUpperCase()}
                            accent
                        />
                    </div>
                </div>
            </header>

            {/* ── Where it came from ─────────────────────────────────────── */}
            <main className="bg-[#FAFAFA] min-h-dvh pt-10 !pb-16">
                <div className="containerbox">
                    <SectionHead
                        eyebrow="By source"
                        title="Where the money came from"
                        accent="pink"
                    />

                    <StatStrip items={streamTiles} cols={4} className="mb-10" />

                    <div className="mb-12">
                        <ReserveWidget />
                    </div>

                    <div
                        className={`mb-12 transition-opacity duration-300 ${
                            isChanging ? "opacity-60" : "opacity-100"
                        }`}
                    >
                        <MonthlyRevenue />
                    </div>

                    <SectionHead
                        eyebrow="Detail"
                        title="Performance breakdown"
                        accent="violet"
                    />

                    <div
                        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 transition-opacity duration-300 ${
                            isChanging ? "opacity-60" : "opacity-100"
                        }`}
                    >
                        <TopEarnPiggyPots
                            currency={props?.global_currency || "gbp"}
                            earnType={earnType}
                        />
                        <TopEarnWishes
                            currency={props?.global_currency || "gbp"}
                            earnType={earnType}
                        />
                        <TopEarnShop
                            currency={props?.global_currency || "gbp"}
                            earnType={earnType}
                        />
                        <TopEarnMemberships
                            currency={props?.global_currency || "gbp"}
                            earnType={earnType}
                        />
                        <PaidTask auth={auth} earnType={earnType} />
                        <TopEarnBills earnType={earnType} />

                        {/* 🚨 SEVEN CARDS IN A THREE-COLUMN GRID LEAVES AN ORPHAN,
                            and it was the supporters card sitting alone with
                            two empty columns beside it — which reads as a
                            missing card rather than as the end of the section.
                            It spans the remainder at BOTH breakpoints (2-up at
                            md, 3-up at xl), so the row is always full.

                            ⚠️ It is also the honest place for it: the six cards
                            above answer "which of my products earned most",
                            and this one answers "who bought" — a different
                            question, and a list rather than a ranking of
                            modules. Full width says so. */}
                        <TopSupporters
                            earnType={earnType}
                            className="md:col-span-2 xl:col-span-3"
                        />
                    </div>
                </div>
            </main>
        </Authenticated>
    );
}

function Fact({ label, value, accent = false }) {
    return (
        <div className="bg-[#15161C] p-5 md:p-7 flex flex-col justify-end">
            <p className={`${TYPE.eyebrow} text-white/55`}>{label}</p>
            <p
                className={`${TYPE.figure} mt-2 text-[22px] md:text-[28px]`}
                style={{ color: accent ? ACCENT.mint.hex : "#FFFFFF" }}
            >
                {value}
            </p>
        </div>
    );
}
