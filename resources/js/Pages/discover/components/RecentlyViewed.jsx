import { useEffect, useState } from 'react';
import FeaturedCarousel from './FeaturedCarousel';
import { DISCOVERY_SOURCE } from '@/lib/discoveryLink';

/**
 * Creators this browser looked at recently.
 *
 * 🚨 IT NEVER LEAVES THE DEVICE. The list is written by the card the visitor
 * clicked and read back here — no request, no user id, nothing stored server
 * side. A guest gets the same continuity as a signed-in supporter, and we learn
 * nothing about either.
 *
 * ⚠️ Rendered only after mount, and only when there is something to show: an
 * empty "Recently viewed" row on a first visit is a row that explains itself
 * badly.
 */

const KEY = 'discover_recently_viewed';
const MAX = 10;

export function rememberCreator(creator) {
    if (!creator?.username) return;
    try {
        const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
        const next = [
            {
                id: creator.id,
                name: creator.name,
                username: creator.username,
                avatar_url: creator.avatar_url,
                cover_url: creator.cover_url,
                top_wish_images: (creator.top_wish_images || []).slice(0, 3),
                price_from: creator.price_from,
                price_from_currency: creator.price_from_currency,
                vat_amount_percentage: creator.vat_amount_percentage,
                items_count: creator.items_count,
                supporter_count: creator.supporter_count,
                unlock_types: creator.unlock_types,
                verified_badge: creator.verified_badge,
                profile_status_lock: creator.profile_status_lock,
                role: creator.role,
            },
            ...raw.filter((c) => c.username !== creator.username),
        ].slice(0, MAX);
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
        // A full or disabled store is not worth breaking a click over.
    }
}

export default function RecentlyViewed({ excludeUsernames = [] }) {
    const [items, setItems] = useState([]);

    useEffect(() => {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
            setItems(raw.filter((c) => c?.username && !excludeUsernames.includes(c.username)));
        } catch (e) {
            setItems([]);
        }
    }, []);

    if (items.length < 2) return null;

    return (
        <FeaturedCarousel
            title="Pick up where you left off"
            kicker="You looked at these"
            subtitle="Still open, still on sale."
            items={items}
            type="creator"
            discoverySource={DISCOVERY_SOURCE.PERSONALISED}
        />
    );
}
