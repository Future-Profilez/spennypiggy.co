import { useEffect, useMemo, useState } from "react";
import axios from "axios";

/**
 * Pick a ready-made cover banner instead of uploading one.
 *
 * The catalogue is built by App\Support\PresetCovers and fetched when this
 * mounts — the picker only renders once the creator opens the cover editor, so
 * there is no reason for every page in the app to carry the list. Selecting one
 * hands the parent the same shape an Uploadcare upload does
 * (`{ uuid, cdnUrl, cdnUrlModifiers }`), so nothing downstream has to care
 * which kind of cover it got.
 */
const FALLBACK_URL = "/cover-banners";

/**
 * Ziggy's route table is a generated snapshot, and `route()` THROWS for a name
 * it does not carry — which is every name added since the last
 * `php artisan ziggy:generate`. Resolved here rather than inside the request so
 * that a stale table falls back to the literal path (the endpoint is a fixed URL
 * with no parameters) instead of surfacing as a load failure the creator is told
 * to fix by refreshing, which never works.
 */
function catalogueUrl() {
    try {
        return route("cover-banners");
    } catch {
        if (import.meta.env.DEV) {
            console.warn(
                "[CoverBannerPicker] route('cover-banners') is missing from ziggy.js — run `php artisan ziggy:generate`. Falling back to " +
                    FALLBACK_URL,
            );
        }

        return FALLBACK_URL;
    }
}

export default function CoverBannerPicker({ selected, onSelect }) {
    const [catalogue, setCatalogue] = useState(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        let live = true;
        setFailed(false);

        axios
            .get(catalogueUrl())
            .then(({ data }) => live && setCatalogue(data))
            .catch(() => live && setFailed(true));

        return () => {
            live = false;
        };
    }, [attempt]);

    // Derived from `catalogue` itself, not from `?? []` / `?? {}` defaults —
    // those are a new identity on every render, so the memos never memoized.
    const tabs = useMemo(() => {
        if (! catalogue) return [];
        const present = new Set(catalogue.covers.map((c) => c.category));

        return [
            ["all", "All"],
            ...Object.entries(catalogue.categories).filter(([id]) => present.has(id)),
        ];
    }, [catalogue]);

    const visible = useMemo(() => {
        const covers = catalogue?.covers ?? [];

        return filter === "all" ? covers : covers.filter((c) => c.category === filter);
    }, [catalogue, filter]);

    if (failed) {
        return (
            <div className="mt-8 rounded-box-sm border-2 border-black/15 bg-white px-4 py-3 text-sm">
                <p>Ready-made covers could not be loaded. You can still upload your own above.</p>
                <button
                    type="button"
                    onClick={() => setAttempt((n) => n + 1)}
                    className="mt-3 min-h-[44px] rounded-box-sm border-2 border-black bg-white px-4 font-semibold transition hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F] focus-visible:ring-offset-2"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-gulfs uppercase text-lg">Or pick a ready-made cover</h3>
                <span className="text-xs text-gray-500">Goes live straight away — no review needed</span>
            </div>

            {/* Height reserved while loading: rendering a lone "All" and then
                reflowing to six tabs shifts the grid right as the creator reaches
                for it. */}
            <div className="-mx-1 mb-4 flex min-h-[44px] gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
                {tabs.map(([id, label]) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setFilter(id)}
                        aria-pressed={filter === id}
                        className={`min-h-[44px] shrink-0 rounded-box-sm border-2 px-4 text-sm font-semibold transition ${
                            filter === id
                                ? "border-black bg-black text-white"
                                : "border-black/15 bg-white text-black hover:border-black/40"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 no-scrollbar sm:grid-cols-2">
                {catalogue === null
                    ? Array.from({ length: 4 }).map((_, i) => (
                          <div
                              key={i}
                              className="aspect-[4/1] w-full rounded-box-sm bg-black/10 motion-safe:animate-pulse"
                          />
                      ))
                    : null}
                {visible.map((cover) => {
                    const isSelected = selected === cover.value;
                    return (
                        <button
                            key={cover.value}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                                onSelect({
                                    uuid: cover.value,
                                    cdnUrl: cover.url,
                                    cdnUrlModifiers: null,
                                })
                            }
                            className={`group relative overflow-hidden rounded-box-sm border-[3px] text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F] focus-visible:ring-offset-2 ${
                                isSelected
                                    ? "border-[#FF007F]"
                                    : "border-transparent hover:border-black/30"
                            }`}
                        >
                            <img
                                src={cover.url}
                                alt={cover.label}
                                loading="lazy"
                                className="aspect-[4/1] w-full bg-gray-100 object-cover"
                            />
                            <span className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-6 text-sm font-semibold text-white">
                                {cover.label}
                                {isSelected ? (
                                    <span className="rounded-full bg-[#FF007F] px-2 py-0.5 text-[11px] uppercase tracking-wide">
                                        Selected
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
