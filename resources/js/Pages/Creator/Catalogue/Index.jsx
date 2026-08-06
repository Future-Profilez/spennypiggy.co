import React, { useEffect, useRef, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Search, PackageOpen, Plus } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ListingRow from "@/Components/Catalogue/ListingRow";

/**
 * "My Listings" — everything a creator sells, in one place.
 *
 * Before this, the answer to "what is on sale, and what is stuck?" lived across six
 * screens with six vocabularies. The default sort is therefore NOT newest-first: it is
 * needs-attention-first, because a listing rejected three weeks ago is the row this
 * page exists to surface and newest-first buries it under everything healthy.
 *
 * Every filter runs on the SERVER. A client-side filter can only see the page already
 * loaded and would answer "no matches" about listings that exist further down — the
 * exact fault the media library in the Purchase Hub had.
 */

const CARD = "bg-white border border-gray-200 rounded-box";
const LABEL = "text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const CONTROL =
    "min-h-[44px] rounded-box-sm border border-gray-200 bg-white px-3 text-[14px] font-medium text-gray-800 focus:border-gray-400 focus:outline-none";

// ⚠️ Not "Needs attention" — that is the name of a filter CHIP directly above this
// control, and the same words on two different controls read as one of them being
// broken.
const SORTS = [
    { value: "attention", label: "Most urgent first" },
    { value: "newest", label: "Newest first" },
    { value: "sales", label: "Best selling first" },
];

function Chip({ active, label, count, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-box-sm border px-3.5 text-[14px] font-semibold transition-colors ${
                active
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
        >
            {label}
            <span
                className={`tabular-nums text-[13px] ${
                    active ? "text-white/70" : "text-gray-400"
                }`}
            >
                {count}
            </span>
        </button>
    );
}

export default function CatalogueIndex() {
    const {
        listings,
        counts,
        filters,
        types,
        statuses,
        counts_are_floor: countsAreFloor,
        auth,
    } = usePage().props;

    const [search, setSearch] = useState(filters?.q || "");

    // ⚠️ Skips its first run. Without the guard the debounce fires on mount and
    // immediately re-requests the page the server just rendered — and on a shared `?q=`
    // link it would clear the very filter that link carries.
    const firstRun = useRef(true);

    const visit = (next) => {
        router.get(
            route("catalogue.index"),
            { ...filters, page: 1, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }

        const id = setTimeout(() => {
            visit({ q: search });
        }, 350);

        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const rows = listings?.data || [];
    const hasAnyListing = (counts?.all || 0) > 0;
    const isFiltered =
        Boolean(filters?.q) ||
        Boolean(filters?.type) ||
        (filters?.status && filters.status !== "all");

    return (
        <AuthenticatedLayout>
            <Head title="My Listings" />

            <div className="min-h-dvh bg-gray-50 pb-28">
                <div className="mx-auto w-full max-w-5xl px-4 pt-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
                                My Listings
                            </h1>
                            <p className="mt-1 text-[14px] text-gray-500">
                                Everything you sell, in one place.
                                {counts?.attention > 0 && (
                                    <>
                                        {" "}
                                        <span className="font-semibold text-red-600">
                                            {counts.attention} need
                                            {counts.attention === 1 ? "s" : ""}{" "}
                                            your attention.
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>

                        {/*
                            The "what do you want to sell?" chooser lives on the profile
                            (Dashboard.jsx), so this hands it `?add=menu` — the one value
                            that opens the chooser and nothing on top of it.
                        */}
                        <Link
                            href={route("user.show", {
                                username: auth?.user?.username,
                                add: "menu",
                            })}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-box-sm bg-[#FF007F] px-4 text-[14px] font-bold text-white"
                        >
                            <Plus size={16} /> Add something
                        </Link>
                    </div>

                    {/*
                        The chip set is FIXED and a type is never hidden at zero. These
                        chips stand in for the six screens this page replaces, and one
                        vanishing when empty reads as the feature being broken rather
                        than as nothing waiting. A zero is information.
                    */}
                    <div className="mt-4 -mx-4 overflow-x-auto px-4">
                        <div className="flex w-max gap-2 pb-1">
                            <Chip
                                label="Everything"
                                count={counts?.all || 0}
                                active={!filters?.type && filters?.status !== "attention"}
                                onClick={() => visit({ type: null, status: null })}
                            />
                            <Chip
                                label="Needs attention"
                                count={counts?.attention || 0}
                                active={filters?.status === "attention"}
                                onClick={() =>
                                    visit({ type: null, status: "attention" })
                                }
                            />
                            <span className="mx-1 self-center text-gray-200">|</span>
                            {(types || []).map((t) => (
                                <Chip
                                    key={t.key}
                                    label={t.plural}
                                    count={counts?.by_type?.[t.key] || 0}
                                    active={filters?.type === t.key}
                                    onClick={() =>
                                        visit({ type: t.key, status: null })
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search your listings"
                                aria-label="Search your listings"
                                className={`${CONTROL} w-full pl-9`}
                            />
                        </div>

                        <label className="sr-only" htmlFor="catalogue-status">
                            Status
                        </label>
                        <select
                            id="catalogue-status"
                            value={filters?.status || "all"}
                            onChange={(e) =>
                                visit({
                                    status:
                                        e.target.value === "all"
                                            ? null
                                            : e.target.value,
                                })
                            }
                            className={CONTROL}
                        >
                            <option value="all">All statuses</option>
                            {Object.entries(statuses || {}).map(([key, meta]) => (
                                <option key={key} value={key}>
                                    {meta.label}
                                </option>
                            ))}
                        </select>

                        <label className="sr-only" htmlFor="catalogue-sort">
                            Sort
                        </label>
                        <select
                            id="catalogue-sort"
                            value={filters?.sort || "attention"}
                            onChange={(e) => visit({ sort: e.target.value })}
                            className={CONTROL}
                        >
                            {SORTS.map((s) => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {countsAreFloor && (
                        <p className={`${LABEL} mt-3`}>
                            You have more listings than this page counts — the
                            numbers above are a minimum.
                        </p>
                    )}

                    <div className="mt-4 space-y-3">
                        {rows.map((item) => (
                            <ListingRow key={item.key} item={item} />
                        ))}
                    </div>

                    {rows.length === 0 && (
                        <div className={`${CARD} mt-4 p-8 text-center`}>
                            <PackageOpen
                                size={28}
                                className="mx-auto text-gray-300"
                            />
                            {/*
                                "Nothing matched your filter" and "you have not listed
                                anything" are opposite problems with opposite fixes.
                                Showing one message for both is how a creator concludes
                                their catalogue is empty when it is not.
                            */}
                            <h2 className="mt-3 text-[17px] font-bold text-gray-900">
                                {isFiltered
                                    ? "Nothing matches that"
                                    : "You have not listed anything yet"}
                            </h2>
                            <p className="mt-1 text-[14px] text-gray-500">
                                {isFiltered
                                    ? "Try a different type or status."
                                    : "Publish something and it will show up here."}
                            </p>
                            {isFiltered ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        visit({ type: null, status: null, q: "" })
                                    }
                                    className="mt-4 inline-flex min-h-[44px] items-center rounded-box-sm border border-gray-200 px-4 text-[14px] font-semibold text-gray-700"
                                >
                                    Clear filters
                                </button>
                            ) : (
                                <Link
                                    href={route("user.show", {
                                        username: auth?.user?.username,
                                        add: "menu",
                                    })}
                                    className="mt-4 inline-flex min-h-[44px] items-center rounded-box-sm bg-[#FF007F] px-4 text-[14px] font-bold text-white"
                                >
                                    Add your first item
                                </Link>
                            )}
                        </div>
                    )}

                    {hasAnyListing && listings?.last_page > 1 && (
                        <div className="mt-5 flex items-center justify-between">
                            <button
                                type="button"
                                disabled={listings.current_page <= 1}
                                onClick={() =>
                                    visit({ page: listings.current_page - 1 })
                                }
                                className="min-h-[44px] rounded-box-sm border border-gray-200 bg-white px-4 text-[14px] font-semibold text-gray-700 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-[13px] text-gray-500">
                                Page {listings.current_page} of{" "}
                                {listings.last_page}
                            </span>
                            <button
                                type="button"
                                disabled={
                                    listings.current_page >= listings.last_page
                                }
                                onClick={() =>
                                    visit({ page: listings.current_page + 1 })
                                }
                                className="min-h-[44px] rounded-box-sm border border-gray-200 bg-white px-4 text-[14px] font-semibold text-gray-700 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
