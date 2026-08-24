import { memo } from 'react';
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";
import { Link } from '@inertiajs/react';
import wishlistbannerimg from "../../../../assets/img/wishlistbannerimg.png";
import Avatar from '../../../includes/Avatar';
import { trackSearchClick } from "@/includes/Analytics";
import { RiFireLine } from 'react-icons/ri';
import VerifiedBadge from '@/Components/VerifiedBadge';

/**
 * CreatorCard — compact rectangular tile. Cover shows as a full landscape banner
 * (not cropped behind an overlay); creator info sits on a dark footer below.
 * Radius follows DESIGN.md: 30px card, 20px inner controls. Item cards unchanged.
 *
 * @param {string} [discoverySource] which SP surface put this creator here.
 *   Defaults to `search-recs` — the reserved key for Discover's search and
 *   result grid, which is where this card started life. A curated carousel
 *   (Trending, New & Verified) passes its own key so the report can tell the
 *   collections apart.
 */
function CreatorCard({ auth, item, discoverySource = DISCOVERY_SOURCE.SEARCH_RECS }) {
    const cover = item.cover_url || wishlistbannerimg;

    return (
        <Link
            /* Discovery-tagged: a creator card on Discover is Spenny Piggy
               putting this creator in front of someone, so the visit is
               SP-generated. The key names WHICH surface — the caller's, or
               `search-recs` for the search and result grid. */
            href={discoveryLink(item.username, discoverySource)}
            onClick={() => trackSearchClick(item.id, item.username)}
            className="group block overflow-hidden rounded-box border border-white/10 bg-[#16161C] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF007F]/50 "
        >
            {/* cover banner — fully visible, shorter */}
            <div className="relative aspect-[21/9] overflow-hidden bg-[#0E0E12]">
                <img
                    src={cover}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]"
                />
                {item.clicks_24h > 0 && (
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[12px] font-semibold text-white backdrop-blur">
                        <RiFireLine size={12} className="text-[#FF007F]" /> {item.clicks_24h}
                    </div>
                )}
                {/* blend cover into footer */}
                {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#16161C] to-transparent" aria-hidden /> */}
            </div>

            {/* footer — avatar overlaps the cover */}
            <div className="p-3 relative flex items-center ">
                <div className="mt-[0px] overflow-hidden rounded-box-sm max-w-[70px] border-[1px] border-pink-500 ">
                    <Avatar
                    auth={auth}
                    user={item}
                    role={item.role}
                    hidename={true}
                    profile_status_lock={item.profile_status_lock == 2 ? true : false}
                    src={item.avatar_url}
                    username={item.username || ""}
                    nolink={true}
                    imgclass="!w-full !h-12 object-cover !border-0" />
                </div>
                <div className="ps-3 min-w-0 pb-0.5">
                    <h3 className="flex items-center gap-1 truncate text-[17px] font-bold leading-tight text-white transition-colors group-hover:text-[#FF9ecb]">
                        <span className="truncate">{item.name}</span>
                        <VerifiedBadge user={item} size="sm" />
                    </h3>
                    <p className="truncate text-sm font-medium text-white/60">@{item.username}</p>
                </div>
            </div>
        </Link>
    );
}

export default memo(CreatorCard);
