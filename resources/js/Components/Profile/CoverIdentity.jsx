import { Suspense, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { ShareIcon } from "@animateicons/react/lucide";
import VerifiedBadge, { verifiedTier } from "@/Components/VerifiedBadge";
import {
    FaInstagram,
    FaXTwitter,
    FaYoutube,
    FaTwitch,
    FaDiscord,
    FaRedditAlien,
    FaFacebookF,
    FaTumblr,
    FaTiktok,
} from "react-icons/fa6";
import userphoto from "../../../assets/siteicon.png";
import lazyRetry from "@/utils/lazyRetry";

// Brand squares, rendered only for links the creator actually set.
const SOCIALS = [
    {
        key: "instagram",
        Icon: FaInstagram,
        base: "https://instagram.com/",
        classes: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
    },
    {
        key: "twitter",
        Icon: FaXTwitter,
        base: "https://twitter.com/",
        classes: "bg-black",
    },
    /*
     * 🚨 TikTok was MISSING from this list while being one of the three
     * platforms verification is performed against (SocialLinks::ACCEPTED_PLATFORMS).
     * A creator whose only handle was TikTok rendered no icon at all — the row
     * existed, the admin had approved it, and their profile showed nothing.
     * Nothing errors on a key this map does not carry.
     *
     * ⚠️ The `@` belongs in the base, not the stored value: the signup form saves
     * a BARE handle (`App\Support\SocialHandle::normalise` strips it) while
     * Creator Studio saves the canonical URL, and both have to build the same link.
     */
    {
        key: "tiktok",
        Icon: FaTiktok,
        base: "https://tiktok.com/@",
        classes: "bg-black",
    },
    { key: "youtube", Icon: FaYoutube, base: "", classes: "bg-[#FF0000]" },
    { key: "twitch", Icon: FaTwitch, base: "", classes: "bg-[#9146FF]" },
    { key: "discord", Icon: FaDiscord, base: "", classes: "bg-[#5865F2]" },
    { key: "reddit", Icon: FaRedditAlien, base: "", classes: "bg-[#FF4500]" },
    { key: "facebook", Icon: FaFacebookF, base: "", classes: "bg-[#1877F2]" },
    {
        key: "tumblr",
        Icon: FaTumblr,
        base: "https://www.tumblr.com/",
        classes: "bg-[#36465D]",
    },
];

const ShareProfile = lazyRetry(() => import("@/wishlist/ShareProfile"));
const FounderBadge = lazyRetry(() => import("@/Components/FounderBadge"));

/**
 * The avatar's approval / missing notice.
 *
 * 🚨 It does NOT use the legacy `.tooltipbtn` + `.approvetag` CSS any more.
 * `.approvetag` (app.css) sets `left:42%` while the markup set `right`, so with
 * both edges pinned the badge stretched across the avatar's face; and
 * `.tooltipbtn p` (home.css) opens the bubble at `left:-118px`, i.e. LEFTWARDS —
 * which on the cover overlay ran straight off the card and was clipped by it,
 * while covering the avatar and the creator's name. This carries its own
 * position instead: pinned to the avatar's bottom-right, opening UPWARDS and
 * centred on the badge, so it clears the name/bio and stays inside the cover
 * card — which is `overflow-hidden`, so a downward bubble would be cut off.
 *
 * The bubble is a <span>, deliberately — a <p> would inherit those same legacy
 * rules again.
 */
function AvatarNotice({ tone, text }) {
    const pending = tone === "pending";
    return (
        <div className="absolute -bottom-0.5 -right-0.5 z-30">
            <button
                type="button"
                aria-label={text}
                className="group/tip relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-white outline-none"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    {pending ? (
                        <path
                            d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.521 6.904 10.713 6.712C10.905 6.52 11.0007 6.28267 11 6C11 5.71667 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 10 5C9.71667 5 9.47933 5.096 9.288 5.288C9.09667 5.48 9.00067 5.71733 9 6C9 6.28333 9.096 6.521 9.288 6.713C9.48 6.905 9.71733 7.00067 10 7ZM10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.175 1.31267 15.1167 0.788 13.9C0.263333 12.6833 0.000666667 11.3833 0 10C0 8.61667 0.262667 7.31667 0.788 6.1C1.31333 4.88333 2.02567 3.825 2.925 2.925C3.825 2.025 4.88333 1.31267 6.1 0.788C7.31667 0.263333 8.61667 0.000666667 10 0C11.3833 0 12.6833 0.262667 13.9 0.788C15.1167 1.31333 16.175 2.02567 17.075 2.925C17.975 3.825 18.6877 4.88333 19.213 6.1C19.7383 7.31667 20.0007 8.61667 20 10C20 11.3833 19.7373 12.6833 19.212 13.9C18.6867 15.1167 17.9743 16.175 17.075 17.075C16.175 17.975 15.1167 18.6877 13.9 19.213C12.6833 19.7383 11.3833 20.0007 10 20Z"
                            fill="#FF8E25"
                        />
                    ) : (
                        <path
                            d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                            fill="#E53935"
                        />
                    )}
                </svg>

                <span className="pointer-events-none invisible absolute left-1/2 bottom-full z-40 mb-2 w-[220px] -translate-x-1/2 rounded-box-sm border-2 border-black bg-white px-3 py-2 text-left text-[12px] font-semibold leading-[1.45] text-black opacity-0 transition-opacity duration-150 group-hover/tip:visible group-hover/tip:opacity-100 group-focus/tip:visible group-focus/tip:opacity-100">
                    {text}
                </span>
            </button>
        </div>
    );
}

/**
 * Who this profile belongs to: avatar, name, verification and @handle.
 *
 * One implementation, two placements —`cover` sits over the full-width banner on
 * desktop (light type on the cover scrim),`card` sits at the top of the identity
 * rail on phones (dark type on white). Keeping it in one component means the
 * approval states below can never drift between the two.
 */
export default function CoverIdentity({ variant = "card", IsloggedIn }) {
    const copyIconRef = useRef(null);
    const { auth, user, slinks } = usePage().props;
    const onCover = variant === "cover";

    const socialItems = SOCIALS.map(({ key, Icon, base, classes }) => {
        const value = slinks?.[key];
        if (!value) return null;
        const isHttp = String(value).trim().toLowerCase().startsWith("http");
        if (!isHttp && !base) return null;
        return (
            <a
                key={key}
                href={isHttp ? value : `${base}${value}`}
                target="_blank"
                rel="noopener noreferrer"
                title={key}
                className={`${classes} flex h-11 w-11 md:h-8 md:w-8 items-center justify-center rounded-box-sm text-white border border-black/10 transition-opacity duration-200 hover:opacity-70`}
            >
                <Icon size={15} />
            </a>
        );
    }).filter(Boolean);

    const avatarSrc = IsloggedIn
        ? user?.avatar_url || userphoto
        : user?.avatar_url && user?.avatar_approved === 1
          ? user?.avatar_url
          : userphoto;

    const avatarSize = onCover
        ? "!h-[112px] !w-[112px] min-w-[112px] !min-h-[112px] xl:!h-[124px] xl:!w-[124px] xl:min-w-[124px] xl:!min-h-[124px]"
        : "!h-[104px] !w-[104px] min-w-[104px] !min-h-[104px] sm:!h-[116px] sm:!w-[116px] sm:min-w-[116px] sm:!min-h-[116px]";

    return (
        <div
            className={
                onCover
                    ? "flex items-end gap-4"
                    : "flex flex-col items-center gap-3"
            }
        >
            <div className="fading userphoto relative group shrink-0 !mb-0 !block">
                {user?.is_founder ? (
                    <div className="absolute -top-1 -right-6 z-20 rotate-6">
                        <Suspense fallback={null}>
                            <FounderBadge size="sm" />
                        </Suspense>
                    </div>
                ) : null}
                {/* White collar so the avatar reads cleanly against any cover image */}
                <div className="relative rounded-full border-2 border-black bg-white p-1.5 ring-4 ring-white">
                    <img
                        alt={`${user?.name || "User"} - Profile Avatar`}
                        src={avatarSrc}
                        height={150}
                        width={150}
                        loading="eager"
                        className={`rounded-full bg-white !border-0 object-cover ${avatarSize}`}
                    />
                </div>

                {IsloggedIn &&
                    auth &&
                    auth?.user?.avatar &&
                    auth?.user?.avatar_approved === 0 && (
                        <AvatarNotice
                            tone="pending"
                            text="Profile avatar is waiting for approval. Currently only you can see this."
                        />
                    )}

                {IsloggedIn &&
                    auth &&
                    auth?.user?.avatar_approved === 2 &&
                    !auth?.user?.avatar_url && (
                        <AvatarNotice
                            tone="missing"
                            text="Profile avatar is missing. Please upload an image to continue."
                        />
                    )}
            </div>

            {/* Name + @handle */}
            <div
                className={`flex min-w-0 flex-col ${onCover ? "items-start pb-1" : "items-center"}`}
            >
                <h1
                    className={`font-gulfs uppercase flex items-center gap-2 leading-tight ${
                        onCover
                            ? "!text-white !text-[26px] xl:!text-[32px] [text-shadow:0_2px_4px_rgba(0,0,0,0.9),0_1px_16px_rgba(0,0,0,0.6)]"
                            : "!text-black !text-[20px] sm:!text-[24px]"
                    }`}
                >
                    <span className="line-clamp-1">{user?.name}</span>
                    {(verifiedTier(user) && (
                        <span className="inline-flex items-center">
                            {user?.is_founder ? (
                                <Suspense
                                    fallback={
                                        <span className="min-w-8 min-h-8 w-8 h-8 ml-1"></span>
                                    }
                                >
                                    <FounderBadge
                                        classes="min-w-8 min-h-8 w-8 h-8"
                                        icon={true}
                                    />
                                </Suspense>
                            ) : (
                                /* ⚠️ The tier colour is kept over the cover photo
                                   rather than forced to white — this is the one
                                   place the grey/pink difference is most worth
                                   reading, so contrast comes from a shadow
                                   instead of throwing the colour away. */
                                <VerifiedBadge
                                    user={user}
                                    size="xl"
                                    className={
                                        onCover
                                            ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
                                            : ""
                                    }
                                />
                            )}
                        </span>
                    )) ||
                        ""}
                </h1>

                <div
                    className={`userId mt-2 flex items-center ${onCover ? "" : "justify-center"}`}
                >
                    <Suspense
                        fallback={
                            <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${onCover ? "border border-white/25 bg-black/45 text-white" : "border border-black/15 bg-gray-50 text-gray-600"}`}
                            >
                                @{user?.username}
                            </span>
                        }
                    >
                        <ShareProfile
                            username={user?.name}
                            classes={`inline-flex min-h-[44px] items-center group rounded-full px-4 py-1 text-sm font-semibold transition-colors ${
                                onCover
                                    ? "border border-white/25 bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
                                    : "border border-black/15 bg-gray-50 text-gray-600 hover:border-black hover:bg-gray-100 hover:text-black"
                            }`}
                            onMouseEnter={() =>
                                copyIconRef.current?.startAnimation?.()
                            }
                            onMouseLeave={() =>
                                copyIconRef.current?.stopAnimation?.()
                            }
                            custom={`${window.location.origin}/${user?.username}`}
                        >
                            @{user?.username}
                            {/* ⚠️ A SHARE glyph, not a copy one. This chip calls
                                navigator.share(), so on a phone tapping it opens
                                the OS share sheet — the icon promised the
                                clipboard and delivered something else. */}
                            <ShareIcon
                                ref={copyIconRef}
                                size={14}
                                className={`ml-2 transition-colors ${onCover ? "text-white/70 group-hover:text-white" : "text-gray-500 group-hover:text-black"}`}
                            />
                        </ShareProfile>
                    </Suspense>

                    {/* Links belong with the identity, so they ride along in both placements */}
                    {onCover && socialItems.length > 0 && (
                        <div className="ms-2 flex flex-wrap items-center gap-1.5">
                            {socialItems}
                        </div>
                    )}
                </div>

                {!onCover && socialItems.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                        {socialItems}
                    </div>
                )}
            </div>
        </div>
    );
}
