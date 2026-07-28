import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Link, usePage, router } from "@inertiajs/react";
import { toast } from "react-hot-toast";
import { TimeFormat } from "@/includes/TimeFormat";
import { likes } from "../../includes/Icons";
import PostLike from "./PostLike";
import CommentList from "./CommetsLists";
import { formatPostContent } from "./Post";
import LazyVideo from "@/Components/LazyVideo";
import PostMediaCarousel, { mediaSrc } from "@/Components/PostMediaCarousel";
import userphoto from "../../../assets/siteicon.png";
import { Menu, Transition } from "@headlessui/react";
import AddPost from "./AddPost";
import RemovePost from "./RemovePost";
import axios from "axios";

/**
 * Each audience owns a colour. The same accent runs through the badge and the
 * locked panel, so the page says who it is for before you read a word of it.
 *
 * This page deliberately drops the house neo-brutalist frame: no black borders,
 * no offset shadows. Separation comes from surface colour and space alone.
 */
const AUDIENCE = {
    public: { label: "Open post", accent: "#3FBF7F", tint: "#EAF7F0" },
    membership: {
        label: "Members only",
        accent: "#7C4DFF",
        tint: "#F1ECFF",
        heading: "This post is for members",
        blurb: "Pick a membership tier to unlock it, along with everything else members get.",
        cta: "See membership tiers",
        page: "memberships",
    },
    subscription: {
        label: "Subscribers only",
        accent: "#9A8B00",
        tint: "#F8F8E4",
        heading: "This post is for subscribers",
        blurb: "Start a subscription to unlock it, along with everything else subscribers get.",
        cta: "See subscriptions",
        page: "bills",
    },
    support: {
        label: "Supporters only",
        accent: "#FF007F",
        tint: "#FFEBF4",
        heading: "This post is for supporters",
        blurb: "Unlock it by picking up something from this creator's page.",
        cta: "Support this creator",
        page: "wishes",
    },
};

const FALLBACK_AUDIENCE = { label: "", accent: "#3FBF7F", tint: "#EAF7F0" };

const PANEL = "rounded-box bg-white";
const PILL =
    "inline-flex items-center gap-2 rounded-full px-3.5 text-[11px] font-black uppercase tracking-wider";
const ACTION =
    "inline-flex min-h-[44px] items-center justify-center rounded-full px-4 text-[11px] font-black uppercase tracking-wider transition-colors";

export default function PostDetail({ post, creator, isOwner, IsloggedIn }) {
    const { auth } = usePage().props;
    const [lcount, setlcount] = useState(post?.likes_count || 0);
    const [ccount, setccount] = useState(post?.comments_count || 0);
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const commentsRef = useRef(null);
    const [isPinned, setIsPinned] = useState(post?.is_pinned || false);
    const [editing, setEditing] = useState(false);

    const updateComments = () => setccount((c) => c + 1);
    const updatecount = (next) => setlcount(next);

    const handleTogglePin = async (e) => {
        e?.stopPropagation();
        try {
            const resp = await axios.post(`/post/pin/${post.uuid}`);
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

    const mediaItems = useMemo(() => {
        if (Array.isArray(post?.media) && post.media.length > 0) return post.media;
        if (!post?.image) return [];
        const isVideo = post.type === "video";
        return [
            {
                uuid: post.image,
                mimeType: isVideo ? "video/mp4" : "image/jpeg",
                isImage: !isVideo,
                isVideo,
                name: "File",
            },
        ];
    }, [post]);

    const isLocked = !IsloggedIn && post?.is_lock !== 0 && post?.for_module !== "public";
    const audience = AUDIENCE[post?.for_module] || FALLBACK_AUDIENCE;
    const isPending = isOwner && Number(post?.approved) !== 1;
    const isUserACreator = auth?.user && parseInt(auth.user.role) === 1;

    useEffect(() => {
        if (lightboxIndex === -1) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") setLightboxIndex(-1);
            if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % mediaItems.length);
            if (e.key === "ArrowLeft")
                setLightboxIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxIndex, mediaItems]);

    const copyLink = async () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied");
        } catch {
            toast.error("Couldn't copy the link. Copy it from the address bar.");
        }
    };

    // Server-supplied counts for a locked post — the files are stripped, these
    // are all a non-entitled viewer gets.
    const lockedContents = useMemo(() => {
        const photos = Number(post?.locked_image_count || 0);
        const videos = Number(post?.locked_video_count || 0);
        const lines = [];
        if (photos > 0) lines.push(`${photos} ${photos === 1 ? "photo" : "photos"}`);
        if (videos > 0) lines.push(`${videos} ${videos === 1 ? "video" : "videos"}`);

        return lines;
    }, [post]);

    /* ---------------------------------------------------------------- media */

    // `paywalled-content` is referenced by the page's paywalled-content JSON-LD
    // (PostsController::applyPostDetailSeo) — renaming it breaks that contract.
    const LockedPanel = () => (
        <div
            className="paywalled-content relative overflow-hidden rounded-box px-5 py-10 text-center sm:px-10 sm:py-14"
            style={{ background: audience.tint }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                    backgroundImage: `repeating-linear-gradient(45deg, ${audience.accent} 0 2px, transparent 2px 16px)`,
                }}
            />
            <div className="relative">
                <span
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white"
                    style={{ background: audience.accent }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <rect x="4" y="10.5" width="16" height="10" rx="2" />
                        <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                    </svg>
                    {audience.label}
                </span>
                <h2 className="mx-auto mt-5 max-w-md text-[20px] font-black uppercase leading-[1.12] tracking-tight sm:text-2xl">
                    {audience.heading || "This post is locked"}
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-black/60 sm:text-base">
                    {audience.blurb || "Only this creator's paying audience can open this one."}
                </p>

                {/* What is actually behind the lock. The files themselves are
                    stripped server-side; only the count travels. */}
                {lockedContents.length > 0 && (
                    <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-2">
                        {lockedContents.map((line) => (
                            <span
                                key={line}
                                className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-black/60"
                            >
                                {line}
                            </span>
                        ))}
                    </p>
                )}
                {/* The page itself is public — anyone can read the headline and see
                    who it is for. Only the content is gated. A signed-out visitor
                    who already paid needs the way back in, or the only path we
                    offer them is to buy something they already own. */}
                {!auth?.user && (
                    <p className="mx-auto mt-4 max-w-sm text-sm text-black/50">
                        Already have access?{" "}
                        <Link href="/login" className="font-bold text-[#FF007F] hover:underline">
                            Log in
                        </Link>
                    </p>
                )}
                {audience.page && (
                    <Link
                        href={`/${creator.username}?page=${audience.page}`}
                        className="mt-7 inline-flex min-h-[50px] items-center justify-center rounded-full px-8 text-sm font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                        style={{ background: audience.accent }}
                    >
                        {audience.cta}
                    </Link>
                )}
            </div>
        </div>
    );

    // One swipeable carousel for any number of items — a grid of five thumbnails
    // makes the reader hunt for the post; a post is read one image at a time.
    // Tapping an image opens the lightbox.
    const renderMedia = () => {
        if (isLocked) return <LockedPanel />;
        if (mediaItems.length === 0) return null;

        return (
            <PostMediaCarousel
                items={mediaItems}
                posterFallback={creator.avatar_url}
                heightClass="h-[300px] sm:h-[420px] lg:h-[520px]"
                onOpen={(i) => setLightboxIndex(i)}
                className="cursor-zoom-in"
            />
        );
    };

    /* ------------------------------------------------------------- sections */

    const facts = [
        ["Published", <TimeFormat key="t" dateString={post.created_at || ""} />],
        ["Audience", audience.label || "Everyone"],
        ["Likes", lcount],
        ["Comments", ccount],
    ];

    return (
        <Authenticated auth={auth} user={creator}>
            <div className="min-h-dvh bg-[#faf8f5] px-3 pb-28 pt-4 sm:px-6 lg:pb-16 lg:pt-6">
                <div className="mx-auto max-w-5xl">
                    <Link
                        href={`/${creator.username}?page=feed`}
                        className="inline-flex min-h-[44px] items-center gap-2 text-[11px] font-black uppercase tracking-wider text-black/60 transition-colors hover:text-[#FF007F]"
                    >
                        ← Back to {creator.name}
                    </Link>

                    <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-6">
                        {/* ---------------------------------------------- main */}
                        <main className="min-w-0 space-y-4 lg:space-y-6">
                            <article className={`${PANEL} p-5 sm:p-7 lg:p-9`}>
                                <div className="flex flex-wrap items-center gap-3">
                                    <Link href={`/${creator.username}`} className="shrink-0">
                                        <img
                                            src={creator.avatar_url || userphoto}
                                            alt=""
                                            className="h-11 w-11 rounded-full object-cover"
                                        />
                                    </Link>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/${creator.username}`}
                                            className="block truncate text-sm font-black uppercase tracking-wider transition-colors hover:text-[#FF007F]"
                                        >
                                            {creator.name}
                                        </Link>
                                        <span className="text-xs font-bold text-black/40">
                                            <TimeFormat dateString={post.created_at || ""} />
                                        </span>
                                    </div>
                                    <div className="ml-auto flex flex-wrap items-center gap-2">
                                        {isOwner && (
                                            <span
                                                className={`${PILL} py-1.5`}
                                                style={
                                                    isPending
                                                        ? { background: "#FEF3C7", color: "#92400E" }
                                                        : { background: "#EAF7F0", color: "#1B7F4F" }
                                                }
                                            >
                                                {isPending ? "⏳ In review" : "✅ Live"}
                                            </span>
                                        )}
                                        {audience.label && (
                                            <span
                                                className={`${PILL} py-1.5`}
                                                style={{
                                                    background: audience.tint,
                                                    color: audience.accent,
                                                }}
                                            >
                                                {audience.label}
                                            </span>
                                        )}
                                        {isOwner && (
                                            <Menu as="div" className="relative z-50 ml-1 inline-block text-left">
                                                <div>
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
                                                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-box bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[99]">
                                                        <div className="px-1 py-1">
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditing(true)}
                                                                        className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm px-4 py-2 text-left text-sm text-black font-bold`}
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
                                                                        className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm px-4 py-2 text-left text-sm text-black font-bold`}
                                                                    >
                                                                        {isPinned ? "Unpin Post" : "Pin Post"}
                                                                    </button>
                                                                )}
                                                            </Menu.Item>
                                                            <Menu.Item>
                                                                {({ active }) => (
                                                                    <div className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm text-sm text-black`}>
                                                                        <RemovePost
                                                                            classes={`px-4 py-2 text-left w-full text-black font-bold`}
                                                                            uuid={post.uuid}
                                                                            text="Remove Post"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Menu.Item>
                                                        </div>
                                                    </Menu.Items>
                                                </Transition>
                                            </Menu>
                                        )}
                                    </div>
                                </div>

                                {/* The chip says the state; this says what it means
                                    for the creator standing on the page. Owner-only —
                                    an unapproved post is a 404 to everyone else. */}
                                {isPending && (
                                    <p className="mt-4 rounded-box-sm bg-[#FEF3C7] px-4 py-3 text-sm leading-relaxed text-[#92400E]">
                                        <strong className="font-black">Waiting for approval.</strong>{" "}
                                        Only you can see this post for now — it usually goes live
                                        within 24 hours, and it counts towards your posting activity
                                        once approved.
                                    </p>
                                )}

                                {post.title && (
                                    <h1 className="mt-5 text-[19px] font-black uppercase leading-[1.15] tracking-tight sm:text-[22px] lg:text-[26px]">
                                        {post.title}
                                    </h1>
                                )}

                                <div className="mt-6">{renderMedia()}</div>

                                {post.content && (
                                    <div className="mt-7 max-w-[62ch] whitespace-pre-line text-[17px] leading-[1.7] text-black/75">
                                        {formatPostContent(post.content, post.mentioned_users || [])}
                                    </div>
                                )}

                                <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-black/[0.07] pt-5">
                                    <span
                                        className={`${ACTION} gap-1.5 bg-black/[0.04] px-3 text-black/70`}
                                    >
                                        <PostLike
                                            is_liked={post.liked}
                                            likes_count={post?.likes_count || 0}
                                            updatecount={updatecount}
                                            text={likes}
                                            post_uuid={post.uuid}
                                        />
                                        {lcount}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            commentsRef.current?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "start",
                                            })
                                        }
                                        className={`${ACTION} bg-black/[0.04] text-black/70 hover:bg-black/[0.08]`}
                                    >
                                        {ccount} {ccount === 1 ? "Comment" : "Comments"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={copyLink}
                                        className={`${ACTION} ml-auto bg-black/[0.04] text-black/70 hover:bg-black/[0.08]`}
                                    >
                                        Copy link
                                    </button>
                                </div>
                            </article>

                            <section
                                ref={commentsRef}
                                className={`${PANEL} scroll-mt-24 p-5 sm:p-7 lg:p-9`}
                            >
                                <h2 className="mb-5 flex items-center gap-3 text-base font-black uppercase tracking-wider sm:text-lg">
                                    Comments
                                    <span className="rounded-full bg-black/[0.05] px-3 py-1 text-xs text-black/60">
                                        {ccount}
                                    </span>
                                </h2>
                                <CommentList
                                    updateComments={updateComments}
                                    post_uuid={post.uuid}
                                />
                            </section>
                        </main>

                        {/* ---------------------------------------------- rail */}
                        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                            <div className={`${PANEL} hidden p-6 text-center lg:block`}>
                                <img
                                    src={creator.avatar_url || userphoto}
                                    alt=""
                                    className="mx-auto h-16 w-16 rounded-full object-cover"
                                />
                                <p className="mt-3 text-sm font-black uppercase tracking-wider">
                                    {creator.name}
                                </p>
                                <p className="text-xs font-bold text-black/40">
                                    @{creator.username}
                                </p>
                                <Link
                                    href={`/${creator.username}`}
                                    className={`${ACTION} mt-4 w-full bg-black text-white hover:bg-black/85`}
                                >
                                    View profile
                                </Link>
                                {isLocked && audience.page && (
                                    <Link
                                        href={`/${creator.username}?page=${audience.page}`}
                                        className={`${ACTION} mt-2 w-full`}
                                        style={{
                                            background: audience.tint,
                                            color: audience.accent,
                                        }}
                                    >
                                        {audience.cta}
                                    </Link>
                                )}

                                <dl className="mt-5 border-t border-black/[0.07] pt-2 text-left">
                                    {facts.map(([term, value], i) => (
                                        <div
                                            key={term}
                                            className={`flex items-center justify-between gap-3 py-2 ${
                                                i > 0 ? "border-t border-black/[0.05]" : ""
                                            }`}
                                        >
                                            <dt className="text-[11px] font-black uppercase tracking-wider text-black/35">
                                                {term}
                                            </dt>
                                            <dd className="truncate text-[11px] font-black uppercase tracking-wide text-black/70">
                                                {value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {isUserACreator && (
                                <div className={`${PANEL} p-5 sm:p-6`}>
                                    <p className="text-sm font-black uppercase leading-tight tracking-wide">
                                        Keep your feed active
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-black/55">
                                        Members and subscribers keep paying while you keep
                                        posting. Three member posts a month keeps every
                                        subscription running.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            window.dispatchEvent(new Event("openAddOptions"));
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className={`${ACTION} mt-4 w-full bg-[#FF007F] text-white hover:opacity-90`}
                                    >
                                        Write a post
                                    </button>
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </div>

            {/* ------------------------------------------------------ lightbox */}
            {lightboxIndex !== -1 && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Post image"
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 md:p-8"
                    onClick={() => setLightboxIndex(-1)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(-1)}
                        aria-label="Close"
                        className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-lg font-black text-white hover:bg-white/25"
                    >
                        ✕
                    </button>

                    {mediaItems.length > 1 && (
                        <button
                            type="button"
                            aria-label="Previous"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex(
                                    (i) => (i - 1 + mediaItems.length) % mediaItems.length,
                                );
                            }}
                            className="absolute left-3 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-lg font-black text-white hover:bg-white/25"
                        >
                            ←
                        </button>
                    )}

                    <div
                        className="flex max-h-[85vh] w-full max-w-4xl items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const media = mediaItems[lightboxIndex];
                            const url = mediaSrc(media, { transform: false });
                            return media.isVideo ? (
                                <LazyVideo
                                    src={url}
                                    fallback={creator.avatar_url}
                                    className="max-h-[80vh] max-w-full rounded-box"
                                    controls
                                />
                            ) : (
                                <img
                                    src={url}
                                    alt="Full size"
                                    className="max-h-[80vh] max-w-full rounded-box object-contain"
                                />
                            );
                        })()}
                    </div>

                    {mediaItems.length > 1 && (
                        <button
                            type="button"
                            aria-label="Next"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((i) => (i + 1) % mediaItems.length);
                            }}
                            className="absolute right-3 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-lg font-black text-white hover:bg-white/25"
                        >
                            →
                        </button>
                    )}

                    {mediaItems.length > 1 && (
                        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-4 py-1 text-xs font-black text-white">
                            {lightboxIndex + 1} / {mediaItems.length}
                        </span>
                    )}
                </div>
            )}
            {editing && (
                <AddPost
                    title="Edit Post"
                    item={post}
                    isEdit={true}
                    open={editing}
                    onClose={() => setEditing(false)}
                />
            )}
        </Authenticated>
    );
}
