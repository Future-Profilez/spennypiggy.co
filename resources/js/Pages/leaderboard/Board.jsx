import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, TrendingUpIcon, XIcon } from "lucide-react";
import confetti from "canvas-confetti";
import RankRow from "./RankRow";
import Podium from "./Podium";
import YouBar from "./YouBar";
import BoardSkeleton from "./BoardSkeleton";
import MovementChip from "./MovementChip";
import LeaderboardStars from "./LeaderboardStars";
import RecentSupporters from "./RecentSupporters";
import CategoryLeaders from "./CategoryLeaders";
import VipSupporters from "./VipSupporters";
import GrowthTrends from "./GrowthTrends";
import PlatformAnalytics from "./PlatformAnalytics";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";
/*
 * 🚨 The board is Spenny Piggy CHOOSING which creators a supporter sees, so
 * every profile link on it is SP-generated traffic and carries a Discovery
 * source — a surface that is not tagged is invisible for ever.
 *
 * `trending` is the key. No reserved key says "leaderboard", and of the twelve
 * it is the closest: both name the creators doing best right now, picked by us.
 * Approximating beats inventing, because the server silently drops anything off
 * the reserved list — which looks exactly like a working tagged link.
 */


const PERIOD_LABELS = {
    all: "All time",
    annual: "Year",
    quarterly: "Quarter",
    monthly: "Month",
    weekly: "Week",
    daily: "Today",
};

/**
 * All time leads and is the default view — it is the standing a creator has
 * actually built. The server's PERIODS constant is ordered shortest-first for
 * its own reasons, which put the default tab last in the row.
 */
const PERIOD_ORDER = ["all", "annual", "quarterly", "monthly", "weekly", "daily"];

/** Confetti fires once per period per day, and never for reduced-motion. */
const celebrationKey = (period) => `spenny_lb_celebrated_${period}_${new Date().toDateString()}`;

export default function Board(props) {
    const {
        auth,
        data: initialData = [],
        is_daily,
        period: initialPeriod = "all",
        total = 0,
        last_page: initialLastPage = 1,
        periods = ["all", "annual", "quarterly", "monthly", "weekly", "daily"],
        you: initialYou = null,
        climbers = [],
        movement_window_days: windowDays,
        opted_out: initialOptedOut = false,
    } = props;

    const [period, setPeriod] = useState(initialPeriod);
    const [rows, setRows] = useState(initialData);
    const [you, setYou] = useState(initialYou);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(initialLastPage);
    const [matched, setMatched] = useState(total);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [optedOut, setOptedOut] = useState(initialOptedOut);

    const availablePeriods = useMemo(
        () =>
            PERIOD_ORDER.filter(
                (p) => periods.includes(p) && (p !== "daily" || is_daily == 1)
            ),
        [periods, is_daily]
    );

    const fetchBoard = useCallback(
        (nextPeriod, query, nextPage) => {
            const append = nextPage > 1;
            append ? setLoadingMore(true) : setLoading(true);
            setError(null);

            return axios
                .get(route("leaderboard", nextPeriod), { params: { q: query || undefined, page: nextPage } })
                .then((resp) => {
                    const payload = resp.data;
                    setRows((prev) => (append ? [...prev, ...payload.data] : payload.data));
                    setLastPage(payload.last_page || 1);
                    setMatched(payload.total ?? 0);
                    if (!append && payload.you !== undefined) setYou(payload.you);
                })
                .catch(() => {
                    setError(
                        append
                            ? "Could not load more creators. Try again."
                            : `Could not load the ${PERIOD_LABELS[nextPeriod] ?? nextPeriod} board. Try again.`
                    );
                })
                .finally(() => {
                    append ? setLoadingMore(false) : setLoading(false);
                });
        },
        []
    );

    const switchPeriod = (next) => {
        if (next === period) return;
        setPeriod(next);
        setPage(1);
        // No trailing slash. `/leaderboard/` changes what a RELATIVE request on
        // this page resolves against — every `axios.get('recent-gifters/…')`
        // would start asking for `/leaderboard/recent-gifters/…` and 404.
        window.history.replaceState({}, "", next === "all" ? "/leaderboard" : `/leaderboard/${next}`);
        fetchBoard(next, search, 1);
    };

    // Search runs on the server across the whole board, so it is debounced
    // rather than filtering the rows already on screen.
    const firstSearchRun = useRef(true);
    useEffect(() => {
        if (firstSearchRun.current) {
            firstSearchRun.current = false;

            return;
        }

        const timer = setTimeout(() => {
            setPage(1);
            fetchBoard(period, search, 1);
        }, 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchBoard(period, search, next);
    };

    // Celebrate once a day per board — it used to fire on every page load,
    // including a refresh, which turns a moment into an interruption.
    useEffect(() => {
        if (!you || you.rank > 10) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (localStorage.getItem(celebrationKey(period))) return;

        localStorage.setItem(celebrationKey(period), "1");
        const timer = setTimeout(
            () => confetti({ particleCount: 90, spread: 80, origin: { y: 0.3 }, colors: ["#FF007F", "#05EFB8", "#E6EA7B"] }),
            400
        );

        return () => clearTimeout(timer);
    }, [you?.rank, period]);

    const handleShare = async () => {
        if (!you) return;

        const label = PERIOD_LABELS[period] ?? period;
        const text = `I'm #${you.rank} of ${you.total} creators on the SpennyPiggy ${label} leaderboard.`;
        const url = `${window.location.origin}/${auth.user.username}`;

        try {
            if (navigator.share) {
                await navigator.share({ title: "My SpennyPiggy rank", text, url });
            } else {
                await navigator.clipboard.writeText(`${text}\n${url}`);
                setError(null);
            }
        } catch {
            /* the viewer dismissed the share sheet — nothing to report */
        }
    };

    const toggleOptOut = () => {
        const next = !optedOut;
        setOptedOut(next);
        axios
            .post(route("leaderboard.opt-out"), { opt_out: next })
            .catch(() => {
                setOptedOut(!next);
                setError("Could not change your leaderboard setting. Try again.");
            });
    };

    const hero = rows.slice(0, 3);
    const rest = rows.slice(3);
    const searching = search.trim().length > 0;

    return (
        <Authenticated auth={auth && auth.user}>
            <Head title="Leaderboard" />

            <div className="min-h-dvh bg-white pt-6">
                <div className="containerbox pb-32 pt-2 sm:pb-12">
                    <div className="flex flex-wrap items-start -mx-4">
                        <div className="w-full px-4 xl:w-2/3">
                            {/* An ink hero gives the page a top edge and lets the
                                board below stay light and quiet. The gold rule is
                                the same accent the podium's first place uses, so
                                the page reads as one system. */}
                            <header className="relative mb-6 overflow-hidden rounded-box bg-[#0B0B0C] px-5 py-8 text-white sm:px-9 sm:py-11">
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-0 h-px"
                                    style={{ background: "linear-gradient(90deg, transparent, #C9A227, transparent)" }}
                                />
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full"
                                    style={{ background: "radial-gradient(circle, rgba(255,0,127,0.18), transparent 70%)" }}
                                />

                                <p className="text-12 font-semibold uppercase tracking-[0.3em] text-white/60">
                                    Ranked by supporters
                                </p>
                                <h1 className="mt-2 text-38 font-semibold leading-[0.92] tracking-[-0.035em] sm:text-60">
                                    Leaderboard
                                </h1>
                                <p className="mt-3 max-w-md text-13 leading-relaxed text-white/60">
                                    Every creator on the platform, re-ranked daily by the supporters backing them.
                                </p>

                                {/* Three facts a creator wants before they scroll:
                                    how big the board is, which slice they're
                                    looking at, and how fresh the arrows are. */}
                                <dl className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 sm:gap-6">
                                    {[
                                        { term: "Creators", value: total },
                                        { term: "Showing", value: PERIOD_LABELS[period] ?? period },
                                        { term: "Movement", value: `${windowDays}d` },
                                    ].map(({ term, value }) => (
                                        <div key={term} className="min-w-0">
                                            <dt className="truncate text-12 font-semibold uppercase tracking-[0.22em] text-white/60">
                                                {term}
                                            </dt>
                                            <dd className="mt-1 truncate font-gulfs text-18 leading-none sm:text-22">
                                                {value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </header>

                            {/* Period — one segmented control, and each one is a URL. */}
                            <div
                                role="tablist"
                                aria-label="Leaderboard period"
                                className="mb-6 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
                            >
                                {availablePeriods.map((p) => (
                                    <button
                                        key={p}
                                        role="tab"
                                        aria-selected={period === p}
                                        onClick={() => switchPeriod(p)}
                                        className={`min-h-[44px] whitespace-nowrap rounded-full px-4 text-12 font-semibold uppercase tracking-[0.12em] transition-colors ${
                                            period === p
                                                ? "bg-[#0B0B0C] text-white"
                                                : "text-black/60 ring-1 ring-inset ring-black/[0.08] hover:text-[#0B0B0C] hover:ring-black/20"
                                        }`}
                                    >
                                        {PERIOD_LABELS[p] ?? p}
                                    </button>
                                ))}
                            </div>

                            {/* Who is top, and by how far. */}
                            {!searching && !loading && hero.length > 0 && (
                                <Podium rows={hero} windowDays={windowDays} />
                            )}

                            {/* Movement is the news, so it sits above the board. */}
                            {climbers.length > 0 && !searching && (
                                <section className="mb-8">
                                    <h2 className="mb-3 flex items-center gap-2 text-12 font-semibold uppercase tracking-[0.22em] text-black/60">
                                        <TrendingUpIcon size={13} strokeWidth={2.5} aria-hidden="true" />
                                        Climbing fastest
                                    </h2>
                                    <ul className="flex flex-wrap gap-2">
                                        {climbers.map((c) => (
                                            <li key={c.id}>
                                                <a
                                                    href={discoveryLink(c.username, DISCOVERY_SOURCE.TRENDING)}
                                                    className="flex min-h-[44px] items-center gap-2.5 rounded-full py-1.5 pl-3 pr-2.5 text-13 ring-1 ring-inset ring-black/[0.08] transition-colors hover:ring-black/25"
                                                >
 <span className="font-gulfs text-15 text-black/60">{c.rank}</span>
                                                    <span className="max-w-[12ch] truncate font-medium text-[#0B0B0C]">
                                                        @{c.username}
                                                    </span>
                                                    <MovementChip direction="up" delta={c.delta} windowDays={windowDays} />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            <div className="relative mb-4">
                                <SearchIcon
                                    size={16}
 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/60"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search every creator on the board"
                                    aria-label="Search creators"
 className="min-h-[48px] w-full rounded-full border-0 bg-black/[0.03] pl-11 pr-11 text-14 text-[#0B0B0C] placeholder:text-black/60 ring-1 ring-inset ring-black/[0.07]  focus:bg-white focus:ring-2 focus:ring-[#0B0B0C]"
                                />
                                {searching && (
                                    <button
                                        onClick={() => setSearch("")}
                                        aria-label="Clear search"
 className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-black/60 transition-colors hover:text-[#0B0B0C]"
                                    >
                                        <XIcon size={16} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div
                                    role="alert"
                                    className="mb-4 flex items-center justify-between gap-3 rounded-box-sm bg-black/[0.03] p-3 text-14 ring-1 ring-inset ring-black/[0.08]"
                                >
                                    <span className="text-[#0B0B0C]">{error}</span>
                                    <button
                                        onClick={() => fetchBoard(period, search, page)}
 className="min-h-[44px] shrink-0 rounded-full bg-[#0B0B0C] px-4 text-12 font-semibold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-85"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            <section className="mb-10 overflow-hidden rounded-box bg-white ring-1 ring-inset ring-black/[0.08]">
                                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/[0.06] px-4 py-4">
 <h2 className="text-12 font-semibold uppercase tracking-[0.22em] text-black/60">
                                        {searching ? "Search results" : "Full ranking"}
                                    </h2>
 <p className="text-12 text-black/60">
                                        {searching
                                            ? `${matched} ${matched === 1 ? "creator" : "creators"} matching “${search}”`
                                            : `Every creator, ranked ${rest.length > 0 ? "from #4 down" : ""}`}
                                    </p>
                                </div>

                                {loading ? (
                                    <BoardSkeleton />
                                ) : rows.length === 0 || (!searching && rest.length === 0) ? (
                                    <div className="px-6 py-16 text-center">
                                        <p className="text-17 font-semibold tracking-tight text-[#0B0B0C]">
                                            {searching ? "No creators found" : "That's everyone so far"}
                                        </p>
                                        <p className="mx-auto mt-1.5 max-w-sm text-13 text-black/60">
                                            {searching
                                                ? "Try a different name or handle."
                                                : rows.length > 0
                                                  ? "The rest of the board fills in as more creators pick up supporters."
                                                  : "This board fills up as creators start selling."}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Search results are a flat list — a podium
                                            of whoever happens to match a query is not
                                            a podium of anything. */}
                                        {searching
                                            ? hero.map((row) => (
                                                  <RankRow
                                                      key={row.id}
                                                      row={row}
                                                      windowDays={windowDays}
                                                      isYou={row.id === auth?.user?.id}
                                                  />
                                              ))
                                            : null}

                                        {rest.map((row) => (
                                            <RankRow
                                                key={row.id}
                                                row={row}
                                                windowDays={windowDays}
                                                isYou={row.id === auth?.user?.id}
                                            />
                                        ))}
                                    </>
                                )}

                                {page < lastPage && !loading && (
                                    <div className="border-t border-black/[0.06] p-3">
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="min-h-[44px] w-full rounded-full text-12 font-semibold uppercase tracking-[0.14em] text-black/60 transition-colors hover:bg-black/[0.03] hover:text-[#0B0B0C] disabled:opacity-50"
                                        >
                                            {loadingMore ? "Loading…" : "Show more creators"}
                                        </button>
                                    </div>
                                )}
                            </section>

                            {auth?.user && (
                                <div className="mb-10 flex items-center justify-between gap-4 rounded-box p-5 ring-1 ring-inset ring-black/[0.08]">
                                    <div>
                                        <p className="text-14 font-semibold tracking-tight text-[#0B0B0C]">
                                            Show me on the leaderboard
                                        </p>
                                        <p className="mt-0.5 text-12 text-black/60">
                                            Turn this off and your profile is removed from every public board.
                                        </p>
                                    </div>
                                    <button
                                        role="switch"
                                        aria-checked={!optedOut}
                                        onClick={toggleOptOut}
                                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] ${
                                            optedOut ? "bg-black/12" : "bg-[#0B0B0C]"
                                        }`}
                                    >
                                        <span className="sr-only">
                                            {optedOut ? "Show me on the leaderboard" : "Hide me from the leaderboard"}
                                        </span>
                                        <span
                                            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white transition-all ${
                                                optedOut ? "left-1" : "left-[26px]"
                                            }`}
                                        />
                                    </button>
                                </div>
                            )}

                            <CategoryLeaders />
                            <GrowthTrends />
                            <PlatformAnalytics />
                        </div>

                        <div className="w-full px-4 xl:w-1/3 xl:self-start">
                            <div className="z-10 xl:sticky xl:top-24">
                                <RecentSupporters />
                                <VipSupporters />
                                <LeaderboardStars />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <YouBar you={you} windowDays={windowDays} onShare={handleShare} />
        </Authenticated>
    );
}
