import React, { useEffect, useState } from "react";
import PurchasesHub from "./PurchasesHub";

const CARD = "bg-white border-[3px] border-black rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";

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
                <div className="text-sm font-bold text-black/55 mt-2">Please refresh and try again.</div>
            </div>
        );
    }

    if (!data) return <HubSkeleton />;

    return <PurchasesHub {...data} embedded />;
}

/* Brutalist skeleton matching the embedded hub layout (no generic spinner). */
function HubSkeleton() {
    return (
        <div className="max-w-[1080px] mx-auto px-4 animate-pulse">
            <div className={`${CARD} grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden`}>
                <div className="p-8 md:p-10 space-y-4">
                    <div className="h-3 w-40 bg-black/15 rounded-[6px]" />
                    <div className="h-10 w-56 bg-black/15 rounded-[8px]" />
                    <div className="h-3 w-64 bg-black/10 rounded-[6px]" />
                    <div className="h-16 w-44 bg-black/15 rounded-[16px] mt-4" />
                </div>
                <div className="bg-[#A2E4B8] border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-black min-h-[200px] md:min-h-[260px] grid grid-cols-2 gap-3 p-6">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square rounded-[12px] border-[3px] border-black bg-white/60" />
                    ))}
                </div>
            </div>
            <div className="flex gap-3 mt-9 mb-8">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 w-32 bg-white border-[3px] border-black rounded-full" />)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className={`${CARD} overflow-hidden`}>
                        <div className="aspect-square border-b-[3px] border-black bg-[#A2E4B8]" />
                        <div className="p-3 space-y-2">
                            <div className="h-3.5 w-3/4 bg-black/15 rounded-[6px]" />
                            <div className="h-3 w-1/2 bg-black/10 rounded-[6px]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
