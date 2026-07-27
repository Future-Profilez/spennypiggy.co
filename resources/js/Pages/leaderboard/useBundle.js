import { useEffect, useState } from "react";
import axios from "axios";

/**
 * Every panel beside the board, from one request.
 *
 * The page used to fire seven requests on load — one per widget, each hitting
 * an uncached aggregate endpoint. They are fetched together here and shared,
 * so mounting a panel costs nothing extra.
 */
let inflight = null;
let cached = null;

export function fetchBundle() {
    if (cached) return Promise.resolve(cached);
    if (inflight) return inflight;

    inflight = axios
        .get(route("leaderboard.bundle"))
        .then((resp) => {
            cached = resp.data;

            return cached;
        })
        .finally(() => {
            inflight = null;
        });

    return inflight;
}

/**
 * @param {string} section  key in the bundle payload
 * @returns {{data: any, loading: boolean, error: string|null, retry: () => void}}
 */
export default function useBundleSection(section) {
    const [data, setData] = useState(cached ? cached[section] : null);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState(null);

    const load = () => {
        setLoading(true);
        setError(null);

        fetchBundle()
            .then((bundle) => {
                // A section resolves to null when its query failed server-side.
                // That is a section-level failure, not a page-level one.
                setData(bundle?.[section] ?? null);
                if (!bundle?.[section]) {
                    setError("This section could not be loaded.");
                }
            })
            .catch(() => setError("This section could not be loaded."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [section]);

    return { data, loading, error, retry: () => { cached = null; load(); } };
}
