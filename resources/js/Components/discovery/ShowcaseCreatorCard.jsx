import Avatar from "@/includes/Avatar";
import { Link } from "@inertiajs/react";

/**
 * 🚨 THE ONE CREATOR CARD ON A DARK SURFACE (22 Aug 2026).
 *
 * `CreatorShowcase` drew this card and `CollectionRow` drew a different, smaller
 * one — so the homepage showed the trending creators as wide accent-framed cards
 * and, four inches below, the SAME KIND OF THING (Hidden Gems, and every other
 * collection) as little cards with a different frame, a different cover height,
 * a different avatar position and no badge. Two ideas of what a creator looks
 * like, on one screen.
 *
 * Extracted rather than copied: a second implementation is how the two drifted in
 * the first place. `CreatorShowcase` renders it with its category accent and
 * badge; `CollectionRow` renders it on dark grounds with the collection's own
 * accent.
 *
 * ⚠️ House rules it carries and must keep: no hover lift, no hover scale — a card
 * signals hover with its own background; the frame is the accent (2px), never a
 * shadow; the badge takes BLACK type because every accent here is a mid-to-light
 * brand hue.
 *
 * ⚠️ `truncate` must keep the value recoverable — a creator name cut at the card
 * edge with no `title` is simply lost.
 */
export default function ShowcaseCreatorCard({
    href,
    name,
    username,
    avatarUrl,
    coverUrl,
    badge,
    accent,
    role,
    profileStatusLock,
}) {
    return (
        <Link
            href={href}
            className="group relative flex h-full flex-col overflow-hidden rounded-box border-2 bg-[#0d0a16] transition-colors duration-200 hover:bg-[#17102a] motion-reduce:transition-none"
            style={{ borderColor: accent }}
        >
            {/* Cover — the creator's own banner, and the whole card's image. */}
            <div className="relative h-[132px] w-full overflow-hidden">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-[filter,opacity] duration-500 ease-out group-hover:brightness-[1.08] motion-reduce:transition-none"
                    />
                ) : (
                    <div
                        className="h-full w-full"
                        style={{
                            background: `linear-gradient(135deg, ${accent}2e 0%, #0d0a16 100%)`,
                        }}
                    />
                )}

                {/* A short fade at the foot only, so the cover meets the card body
                    without a hard cut. The artwork itself is left alone. */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#0d0a16]" />

                {badge ? (
                    <span
                        className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border-2 border-black px-3 py-1 font-poppins text-[12px] font-semibold uppercase tracking-[0.14em] text-black"
                        style={{ background: accent }}
                    >
                        {badge}
                    </span>
                ) : null}
            </div>

            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4">
                <div className="flex items-center gap-3">
                    {/* Avatar pins itself to 60px via an injected stylesheet and nests
                        two height-less wrappers inside this box, so a percentage
                        height resolves against `auto` and collapses the image to
                        nothing. Size it in px. */}
                    <div className="shrink-0 overflow-hidden rounded-box-sm bg-[#1a162b]">
                        <Avatar
                            src={avatarUrl}
                            role={role}
                            profile_status_lock={profileStatusLock}
                            nolink={true}
                            imgclass="!w-[46px] !h-[46px] !min-w-[46px] !min-h-[46px] !max-w-[46px] !max-h-[46px] !border-0 !rounded-none"
                        />
                    </div>

                    <div className="min-w-0">
                        <h3
                            title={name}
                            className="truncate font-gulfs text-[17px] uppercase leading-tight tracking-wide text-white"
                        >
                            {name}
                        </h3>
                        <p
                            title={`@${username}`}
                            className="truncate font-poppins text-xs text-white/60"
                        >
                            @{username}
                        </p>
                    </div>

                    <span
                        aria-hidden
                        className="ml-auto shrink-0 font-gulfs text-lg transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
                        style={{ color: accent }}
                    >
                        →
                    </span>
                </div>
            </div>
        </Link>
    );
}
