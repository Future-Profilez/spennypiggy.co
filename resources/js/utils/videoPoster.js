import { useEffect, useState } from "react";

/**
 * Lazy video poster resolver.
 *
 * Posters are generated server-side via the Uploadcare conversion API and
 * cached in the `video_posters` table. The frontend asks for a poster by the
 * source video UUID; until one is ready it falls back to the creator avatar.
 *
 * Requests are batched (one POST per animation frame-ish window) and cached in
 * memory so a list of videos triggers a single round-trip.
 */

const CDN_RE = /ucarecdn\.com\/([0-9a-f-]{36})/i;

/** Pull the Uploadcare UUID out of a CDN url (or return null). */
export function uuidFromUrl(url) {
    if (!url || typeof url !== "string") return null;
    const m = url.match(CDN_RE);
    return m ? m[1].toLowerCase() : null;
}

const CACHE_MAX = 500;
const cache = new Map();        // uuid -> posterUrl | null (null = asked, not ready)
const subscribers = new Map();  // uuid -> Set<callback>
let queue = new Set();
let flushTimer = null;

function cacheSet(uuid, val) {
    // Simple bounded LRU: re-insert moves to newest; evict oldest over the cap.
    if (cache.has(uuid)) cache.delete(uuid);
    cache.set(uuid, val);
    if (cache.size > CACHE_MAX) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
    }
}

function notify(uuid) {
    const subs = subscribers.get(uuid);
    if (subs) subs.forEach((cb) => cb(cache.get(uuid)));
}

async function flush() {
    flushTimer = null;
    // Skip only UUIDs we already have a real poster for; null (not-ready-yet)
    // stays eligible so a retry can pick it up once generation completes.
    const uuids = Array.from(queue).filter((u) => !cache.get(u));
    queue = new Set();
    if (!uuids.length) return;

    // Chunk to the endpoint's 50-uuid cap.
    for (let i = 0; i < uuids.length; i += 50) {
        const chunk = uuids.slice(i, i + 50);
        try {
            const { data } = await window.axios.post("/video-posters", { uuids: chunk });
            const posters = (data && data.posters) || {};
            chunk.forEach((uuid) => {
                const url = posters[uuid] || null;
                cacheSet(uuid, url);
                notify(uuid);
            });
        } catch (e) {
            // Network/validation failure — leave on fallback, don't retry-storm.
            chunk.forEach((uuid) => {
                if (!cache.has(uuid)) cacheSet(uuid, null);
            });
        }
    }
}

function enqueue(uuid) {
    if (cache.get(uuid)) return; // already have a real poster
    queue.add(uuid);
    if (!flushTimer) flushTimer = setTimeout(flush, 60);
}

/**
 * Resolve a poster for a video.
 * @param {string} videoUrl  Source video URL (Uploadcare CDN).
 * @param {string} fallback  Poster shown until the real one is ready (avatar/default).
 * @returns {string|undefined} poster URL to put on the <video poster>.
 */
export function useVideoPoster(videoUrl, fallback) {
    const uuid = uuidFromUrl(videoUrl);
    const [poster, setPoster] = useState(() => (uuid && cache.get(uuid)) || fallback);

    useEffect(() => {
        if (!uuid) {
            setPoster(fallback);
            return;
        }

        const ready = cache.get(uuid);
        if (ready) {
            setPoster(ready);
            return;
        }

        // Subscribe for when the poster becomes ready, then request it.
        const cb = (url) => setPoster(url || fallback);
        if (!subscribers.has(uuid)) subscribers.set(uuid, new Set());
        subscribers.get(uuid).add(cb);
        setPoster(fallback);
        enqueue(uuid);

        // One delayed re-ask: posters generate async, so a not-ready miss may
        // be ready a few seconds later without another page load.
        const retry = setTimeout(() => {
            if (!cache.get(uuid)) enqueue(uuid);
        }, 8000);

        return () => {
            clearTimeout(retry);
            const subs = subscribers.get(uuid);
            if (subs) subs.delete(cb);
        };
    }, [uuid, fallback]);

    return poster;
}
