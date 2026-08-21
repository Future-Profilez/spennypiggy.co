import { useState, Fragment } from "react";
import { likes, comment } from "../../includes/Icons";
import { TimeFormat } from "@/includes/TimeFormat";
import supportorsimg from "../../../assets/img/supportors-img.png";
import subscriberimg from "../../../assets/img/subscribers-img.png";
import membershipimg from "../../../assets/img/membership-img.png";
import PostLike from "./PostLike";
import CommentList from "./CommetsLists";
import { Menu, Transition } from "@headlessui/react";
import AddPost from "./AddPost";
import { Link, usePage, router } from "@inertiajs/react";
import userphoto from "../../../assets/siteicon.png";
import RemovePost from "./RemovePost";
import PostMediaCarousel, { mediaSrc } from "@/Components/PostMediaCarousel";
import { Lock } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const AUDIENCE_LABELS = {
    public: "Shoutout",
    membership: "Members Only",
    subscription: "Subscribers Only",
    support: "Supporters Only",
};

const LOCK_COPY = {
    membership: {
        label: "Members only",
        cta: "See membership tiers",
        page: "memberships",
    },
    subscription: {
        label: "Subscribers only",
        cta: "See subscriptions",
        page: "bills",
    },
    support: {
        label: "Supporters only",
        cta: "Support this creator",
        page: "wishes",
    },
};

/**
 * Renders a post body: pasted links become clickable, and `@handle` becomes a
 * link to that creator.
 *
 * `mentions` is the list the server resolved when the post was saved. Pass it
 * and only real creators are linked — without it every `@word` became a link,
 * so a typo or a plain "@everyone" led to a 404. No list means "link nothing",
 * which is the safe default for surfaces that don't carry the relation yet.
 */
export function formatPostContent(text, mentions = null) {
    if (!text) return null;

    const known = mentions
        ? new Set(mentions.map((m) => String(m.username || "").toLowerCase()))
        : null;

    const parts = text.split(/(https?:\/\/[^\s]+|@[a-zA-Z0-9_.]+)/g);

    return parts.map((part, index) => {
        if (!part) return null;

        if (/^https?:\/\//i.test(part)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-[#FF007F] font-bold hover:underline break-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }

        if (part.startsWith("@")) {
            const username = part.slice(1).replace(/\.+$/, "");
            if (!known || known.has(username.toLowerCase())) {
                return (
                    <a
                        key={index}
                        href={`/${username}`}
                        className="text-[#FF007F] font-bold hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        @{username}
                        {part.slice(1 + username.length)}
                    </a>
                );
            }
        }

        return part;
    });
}

export default function Post({ item, isProfileView = false }) {
    const { auth } = usePage().props;
    const isPostOwner = auth?.user && (parseInt(item?.user_id) === parseInt(auth?.user?.id));
    const IsloggedIn = isPostOwner;

    const [isPinned, setIsPinned] = useState(item?.is_pinned || false);
    const creatorUsername = item?.user?.username || auth?.user?.username;
    const isLocked =
        !IsloggedIn && item?.is_lock !== 0 && item?.for_module !== "public";

    const detailUrl = `/${creatorUsername}/post/${item.slug || item.uuid}`;

    const handleCardClick = (e) => {
        if (!isProfileView) return;
        
        // Don't navigate if user clicked an interactive element (button, link, menu, input)
        if (
            e.target.closest('button') || 
            e.target.closest('a') || 
            e.target.closest('.dots') || 
            e.target.closest('[role="menuitem"]') ||
            e.target.closest('textarea') ||
            e.target.closest('form')
        ) {
            return;
        }
        router.visit(detailUrl);
    };

    const handleTogglePin = async (e) => {
        e?.stopPropagation();
        try {
            const resp = await axios.post(`/post/pin/${item.uuid}`);
            if (resp.data.status) {
                setIsPinned(resp.data.is_pinned);
                toast.success(resp.data.msg);
                router.reload({ preserveScroll: true });
            } else {
                toast.error(resp.data.msg);
            }
        } catch (err) {
            toast.error(err?.response?.data?.msg || "Something went wrong.");
        }
    };

    // Extract all media items from the media field, or fall back to the single image field
    const hasMediaArray = item?.media && Array.isArray(item.media) && item.media.length > 0;
    const mediaItems = hasMediaArray 
        ? item.media 
        : (item?.image_url ? [{ uuid: item.image || item.image_url, mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg', isImage: item.type !== 'video', isVideo: item.type === 'video', name: 'File' }] : []);

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const activeMedia = mediaItems[currentMediaIndex];
    const isVideo = activeMedia?.isVideo || activeMedia?.mimeType?.startsWith('video/') || false;

    // Creator attribution overlay. The post row carries it directly (the profile
    // feed does not load the owner relation — serialising a partially-loaded
    // User fires ~15 appended accessors per row); surfaces that do carry the
    // owner fall through to it. Undefined on either means no watermark.
    const postWatermarkOps = item?.watermark_ops ?? item?.user?.watermark_ops ?? null;

    function posturl() {
        if (item && item?.for_module == "public") {
            return item.image_url || false;
        }
        if (IsloggedIn || (item && item.is_lock === 0)) {
            if (hasMediaArray && activeMedia && activeMedia.uuid) {
                return mediaSrc(activeMedia, { watermarkOps: postWatermarkOps });
            }
            return item.image_url;
        } else {
            if (item && item.for_module == "membership") return membershipimg;
            if (item && item.for_module == "subscription") return subscriberimg;
            if (item && item.for_module == "support") return supportorsimg;
            return item.image_url;
        }
    }

    const [lcount, setlcount] = useState(item?.likes_count || 0);
    const [ccount, setccount] = useState(item?.comments_count || 0);
    const updateComments = () => setccount((c) => c + 1);
    const updatecount = (next) => setlcount(next);
    const [showComments, setShowComments] = useState(false);
    const [editing, setEditing] = useState(false);

    const audienceLabel = AUDIENCE_LABELS[item?.for_module] || "";
    const isPendingApproval = IsloggedIn && Number(item?.approved) === 0;
    const lock = LOCK_COPY[item?.for_module];
    const hasImage = !!posturl();

    // A queued post reaches nobody but its author, so the chip only means
    // anything to them — and `is_scheduled` is only ever true on a payload the
    // owner asked for (the global publish scope hides the rest).
    const isScheduled = IsloggedIn && Boolean(item?.is_scheduled);
    const scheduledLabel = isScheduled
        ? new Date(item.scheduled_at).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
          })
        : "";

    const singleLineStyle = isProfileView ? {
        display: '-webkit-box',
        WebkitLineClamp: '1',
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    } : {};

    const renderMediaPreview = () => {
        if (isLocked) {
            return (
                <img 
                    alt="Locked post placeholder"
                    className={`post-img w-full object-cover ${isProfileView ? 'h-[200px] md:h-[240px]' : 'max-h-[400px]'}`}
                    src={posturl()}
                />
            );
        }

        if (mediaItems.length === 0) return null;

        // One shared carousel (swipe + dots + counter) instead of this card's own
        // arrows: the old code also built its image URL with `-/quality/85/`,
        // which is not a valid Uploadcare operation, so every multi-image post
        // rendered a broken thumbnail.
        return (
            <PostMediaCarousel
                items={mediaItems}
                posterFallback={item?.user?.avatar_url}
                heightClass={isProfileView ? "h-[220px] md:h-[260px]" : "h-[300px] md:h-[400px]"}
                rounded=""
                watermarkOps={postWatermarkOps}
            />
        );
    };

    return (
        <>
            <div 
                onClick={handleCardClick}
                className={`post-wrap bg-[#fdfbf7] rounded-box p-[15px] xl:p-4 !mb-4 md:!mb-[22px] border-[3px] border-black transition-[filter] duration-200 hover:brightness-[0.98] ${isProfileView ? 'cursor-pointer' : ''}`}
            >
                <div className="flex items-center justify-between  gap-2">
                    {/* `.post-wrap .headerpost` is width:100%, so the chip next to it
                        was squeezed to zero and spilled outside the card. It keeps its
                        own width (shrink-0) and the author block takes the rest. */}
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                       
                        <Link
                            href={`/${creatorUsername || ""}`}
                            className="headerpost mb-0 head !w-auto min-w-0"
                        >
                            
                            <img
                                alt={`${item?.user?.name || auth?.user?.name || "Creator"} avatar`}
                                className=" author-img border-[3px] border-black rounded-full "
                                src={
                                    item?.user?.avatar_url ||
                                    userphoto
                                }
                            />
                            <div>
                                <p className="authors text-black font-black !capitalize tracking-wider">
                                    {" "}
                                    <b>
                                        {" "}
                                        {item?.user?.name ||
                                            "SPENNY PIGGY"}{" "}
                                    </b>{" "}
                                </p>
                                <p className="authors text-gray-700 font-bold text-sm">
                                    {" "}
                                    <TimeFormat
                                        dateString={
                                            item?.created_at ||
                                            item?.updated_at ||
                                            ""
                                        }
                                    />{" "}
                                </p>
                            </div>
                        </Link>
                    </div>

                    {IsloggedIn ? (
                        <Menu
                            as="div"
                            // z-50: the audience badge over the media is z-10 and sits
                            // later in the DOM, so an open menu was painted underneath it.
                            className="relative z-50 inline-block text-left"
                        >
                            <div>
                                {/* The old `.dots` markup was invisible here: the global
                                    `.dots span { background: #fff }` rule outranks the
                                    `bg-gray-900` utility on the spans, so the owner menu
                                    was white-on-white on every light card. */}
                                <Menu.Button
                                    aria-label="Post options"
                                    className="edit-post flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent p-0 text-black/60 transition-colors hover:bg-black/[0.06] hover:text-black"
                                >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                                        <circle cx="12" cy="5" r="2" />
                                        <circle cx="12" cy="12" r="2" />
                                        <circle cx="12" cy="19" r="2" />
                                    </svg>
                                </Menu.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-box bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditing(true)}
                                                    className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm px-4 py-2 text-left text-sm`}
                                                >
                                                    Edit Post
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    type="button"
                                                    onClick={handleTogglePin}
                                                    className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm px-4 py-2 text-left text-sm`}
                                                >
                                                    {isPinned ? "Unpin Post" : "Pin Post"}
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <div
                                                    className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm text-sm`}
                                                >
                                                    <RemovePost
                                                        classes={`px-4 py-2 text-left w-full`}
                                                        uuid={item.uuid}
                                                        text="Remove Post"
                                                    />
                                                </div>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    ) : (
                        ""
                    )}
                </div>

                {editing && (
                    <AddPost
                        title="Edit Post"
                        item={item}
                        isEdit={true}
                        open={editing}
                        onClose={() => setEditing(false)}
                    />
                )}

                {/* Waiting-for-approval used to be a four-line block above the
                    media, pushing the post itself below the fold on a phone. It
                    is a status, not the content — it rides on the image as a chip
                    (with the full explanation on hover/long-press) and only falls
                    back to a block when the post has no image to sit on. */}
                {/* Scheduled outranks "in review": both are true of a queued post,
                    but the date is the fact the creator is looking for, and a
                    lone "In review" chip on a post they deliberately queued reads
                    as though the schedule was not saved. */}
                {isScheduled && !hasImage ? (
                    <div className="mb-3 flex items-center gap-2 rounded-box-sm border !border-black bg-[#A2E4B8] px-3 py-2 text-xs font-bold text-black">
                        <span aria-hidden="true">🕒</span>
                        <span>Publishes {scheduledLabel}</span>
                    </div>
                ) : isPendingApproval && !hasImage ? (
                    <div className="mb-3 flex items-center gap-2 rounded-box-sm border !border-yellow-500 bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-800">
                        <span aria-hidden="true">⏳</span>
                        <span>In review — only you can see this for now.</span>
                    </div>
                ) : null}

                {hasImage ? (
                    <div className=" post-images lazywrap relative w-full border-[3px] border-black rounded-box-sm overflow-hidden">
                        {audienceLabel ? (
                            <span className="bg-[#A2E4B8] border-[3px] border-black  font-black absolute z-10 py-2 px-4 top-3 right-3 uppercase text-xs text-black rounded-box-sm">
                                {audienceLabel}
                            </span>
                        ) : null}

                        {isScheduled ? (
                            <span
                                title="Only you can see this until it publishes. You can change the time or cancel it until then."
                                className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border-2 border-black bg-[#A2E4B8] px-2.5 py-1 text-[12px] font-black uppercase tracking-wider text-black"
                            >
                                🕒 {scheduledLabel}
                            </span>
                        ) : isPendingApproval ? (
                            <span
                                title="Only you can see this post for now — it usually goes live within 24 hours, and it counts towards your activity once approved."
                                className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[12px] font-black uppercase tracking-wider text-white backdrop-blur-sm"
                            >
                                ⏳ In review
                            </span>
                        ) : null}

                        {renderMediaPreview()}
                        {isPinned && (
                            <span className="absolute left-3 bottom-3 z-10 flex shrink-0 items-center gap-1 rounded-box-sm border border-yellow-400 bg-yellow-100 px-2 py-0.5 text-[12px] font-black uppercase text-yellow-800">
                                📌 Pinned
                            </span>
                        )}

                        {item.ai_generated == 1 ? (
                            <div className="absolute bottom-3 left-3 z-10 bg-black rounded-box-sm px-2 py-1 text-[12px] text-white">
                                MADE WITH AI{" "}
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                ) : audienceLabel ? (
                    <span className="inline-block bg-[#A2E4B8] border-[3px] border-black  font-black py-1.5 px-3 uppercase text-xs text-black rounded-box-sm">
                        {audienceLabel}
                    </span>
                ) : null}

                <div>
                    {item?.title ? (
                        <p 
                            className="fading description text-black font-black text-normal mt-4 mb-2 pr-5 uppercase tracking-wide"
                            style={singleLineStyle}
                        >
                            <b>{item.title}</b>
                        </p>
                    ) : null}
                    {item?.content ? (
                        <p 
                            className="fading description text-gray-800 font-normal mt-2 text-sm md:text-base leading-relaxed"
                            style={singleLineStyle}
                        >
                            {formatPostContent(item.content, item.mentioned_users || [])}
                        </p>
                    ) : null}
                </div>

                {/* 🚨 THE UNLOCK PATH IS A PATH SEGMENT, NOT A QUERY STRING
                    (21 Aug 2026). This linked `/{username}?page=memberships`,
                    but the profile route is `/{username}/{page?}` — `page` is a
                    ROUTE parameter, so the query string was ignored and every
                    locked post in the feed dropped the visitor on the About tab
                    instead of the tiers that unlock it. The highest-intent tap
                    on the page went to the wrong screen and nothing errored. */}
                {isLocked && lock && creatorUsername ? (
                    <Link
                        href={`/${creatorUsername}/${lock.page}`}
                        className="mt-4 flex items-center justify-center gap-2 w-full min-h-[44px] bg-[#FF007F] text-black font-black uppercase tracking-wide text-sm border-black rounded-box-sm px-4 py-3 transition-[filter,transform] duration-200 hover:brightness-110 active:brightness-95 active:translate-x-[2px] active:translate-y-[2px]"
                    >
                        <Lock size={15} strokeWidth={3} className="shrink-0" />
                        {lock.cta}
                    </Link>
                ) : null}

                <div className="interactions flex items-center mt-2 ">
                    <PostLike
                        is_liked={item.liked}
                        likes_count={item?.likes_count || 0}
                        updatecount={updatecount}
                        text={likes}
                        post_uuid={item.uuid}
                    />
                    <button
                        type="button"
                        aria-expanded={showComments}
                        aria-label={
                            showComments ? "Hide comments" : "Show comments"
                        }
                        className="relative bg-transparent border-0 p-0 ml-4 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-70"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowComments(!showComments);
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: comment }} />
                        {item.pending_items_count > 0 && (
                            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[12px] font-bold text-white border-2 border-white animate-pulse">
                                {item.pending_items_count}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex mt-1">
                    <p className="fading like-count text-black mr-4 font-black uppercase text-sm border-[3px] border-black bg-[#A2E4B8] px-3 py-1 rounded-box-sm ">
                        <b className='text-[12px] md:text-[14px] '>
                            {lcount || 0} {lcount === 1 ? "like" : "likes"}
                        </b>
                    </p>
                    <p className="fading like-count text-black font-black uppercase text-sm border-[3px] border-black bg-[#b892ff] px-3 py-1 rounded-box-sm ">
                        <b className="text-[12px] md:text-[14px]">
                            {ccount || 0}{" "}
                            {ccount === 1 ? "Comment" : "Comments"}
                        </b>
                    </p>
                </div>

                {showComments ? (
                    <div onClick={(e) => e.stopPropagation()}>
                        <CommentList
                            updateComments={updateComments}
                            post_uuid={item.uuid}
                        />
                    </div>
                ) : (
                    ""
                )}
            </div>
        </>
    );
}
