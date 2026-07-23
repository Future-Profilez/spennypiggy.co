import { memo } from 'react';
import { Link } from '@inertiajs/react';
import wishlistbannerimg from "../../../../assets/img/wishlistbannerimg.png";
import Avatar from '../../../includes/Avatar';
import { trackSearchClick } from "@/includes/Analytics";
import { RiFireLine, RiVerifiedBadgeFill } from 'react-icons/ri';

/**
 * CreatorCard — compact rectangular tile. Cover shows as a full landscape banner
 * (not cropped behind an overlay); creator info sits on a dark footer below.
 * Radius follows DESIGN.md: 30px card, 20px inner controls. Item cards unchanged.
 */
function CreatorCard({ auth, item }) {
    const cover = item.cover_url || wishlistbannerimg;
    const verified = item.profile_status_lock == 2 || item.is_verified;

    return (
        <Link
            href={route('user.show', item.username)}
            onClick={() => trackSearchClick(item.id, item.username)}
            className="group block overflow-hidden rounded-[30px] border border-white/10 bg-[#16161C] shadow-[0_10px_30px_-14px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF007F]/50 hover:shadow-[0_18px_44px_-14px_rgba(255,0,127,0.4)]"
        >
            {/* cover banner — fully visible, shorter */}
            <div className="relative aspect-[21/9] overflow-hidden bg-[#0E0E12]">
                <img
                    src={cover}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.clicks_24h > 0 && (
                    <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                        <RiFireLine size={12} className="text-[#FF007F]" /> {item.clicks_24h}
                    </div>
                )}
                {/* blend cover into footer */}
                {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#16161C] to-transparent" aria-hidden /> */}
            </div>

            {/* footer — avatar overlaps the cover */}
            <div className="p-3 relative flex items-center ">
                <div className="mt-[0px] overflow-hidden rounded-[20px] max-w-[70px] border-[1px] border-pink-500  shadow-[0_6px_6px_-6px_rgba(0,0,0,0.8)]">
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
                        {verified && <RiVerifiedBadgeFill className="shrink-0 text-[#3BA3FF]" size={14} />}
                    </h3>
                    <p className="truncate text-sm font-medium text-white/50">@{item.username}</p>
                </div>
            </div>
        </Link>
    );
}

export default memo(CreatorCard);
