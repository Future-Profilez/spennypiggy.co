import React, { useEffect, useState } from "react";
import PurchasesHub from "./PurchasesHub";

const CARD = "bg-white border border-zinc-200/70 rounded-box ";

/**
 * Owner-only profile tab: self-fetches the logged-in gifter's full hub payload
 * (Auth::user() server-side) and renders the embedded PurchasesHub.
 */
export default function GifterPurchasesTab() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let alive = true;
        fetch("/my-purchases-data", { headers: { Accept: "application/json" } })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((d) => alive && setData(d))
            .catch(() => alive && setError(true));
        return () => { alive = false; };
    }, []);

    if (error) {
        return (
            <div className={`${CARD} py-12 text-center max-w-[1080px] mx-auto`}>
                <div className="text-lg font-black uppercase tracking-widest text-black">Couldn’t load your purchases</div>
                <div className="text-sm font-bold text-black/60 mt-2">Please refresh and try again.</div>
            </div>
        );
    }

    if (!data) return <HubSkeleton />;

    return <PurchasesHub {...data} embedded />;
}

/* Soft skeleton matching the embedded hub layout (no generic spinner). */
function HubSkeleton() {
    return (
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 animate-pulse">
            <div className={`${CARD} grid lg:grid-cols-[1.1fr_0.9fr] overflow-hidden`}>
                <div className="p-7 md:p-9 space-y-4">
                    <div className="h-3 w-32 bg-zinc-100 rounded" />
                    <div className="h-9 w-52 bg-zinc-100 rounded-box-sm" />
                    <div className="h-3 w-64 bg-zinc-100 rounded" />
                    <div className="h-12 w-40 bg-zinc-100 rounded-box-sm mt-4" />
                </div>
                <div className="bg-zinc-50 border-t lg:border-t-0 lg:border-l border-zinc-200/70 min-h-[200px] md:min-h-[260px] grid grid-cols-2 gap-2.5 p-7">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square rounded-box-sm border border-zinc-200 bg-white" />
                    ))}
                </div>
            </div>
            <div className="flex gap-2 mt-8 mb-7">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-9 w-28 bg-zinc-100 rounded-full" />)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className={`${CARD} overflow-hidden`}>
                        <div className="aspect-square bg-zinc-100" />
                        <div className="p-3.5 space-y-2">
                            <div className="h-3.5 w-3/4 bg-zinc-100 rounded" />
                            <div className="h-3 w-1/2 bg-zinc-100 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
