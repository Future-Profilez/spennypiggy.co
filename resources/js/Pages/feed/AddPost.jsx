import { useEffect, useId, useRef, useState } from "react";
import Popup from "@/Components/Popup";
import st from "../../../css/uploader.module.css";
import GlobalUploader from "@/uploadcare/Uploader";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAlerts } from "@/Components/Alerts";
import { FaPenNib } from "react-icons/fa6";
// ⚠️ "Use AI" is switched off (14 Aug 2026, client direction). The import and the
// button are commented out together — an unused import is what makes a disabled
// feature look accidentally deleted next time someone reads this file.
// import ImageGenerationWithAI from "@/Components/ImageGenerationWithAI";
import { router, usePage } from "@inertiajs/react";
import MentionTextarea from "@/Components/MentionTextarea";
import PostMediaCarousel from "@/Components/PostMediaCarousel";
import { formatPostContent } from "./Post";

const TITLE_MAX = 150;
const CONTENT_MAX = 5000;
/**
 * Images/videos per post.
 *
 * ⚠️ There was no cap at all — the uploader is `multiple` with no `multipleMax`
 * — so this number had to be enforced before it could be stated. A limit the UI
 * announces and the code does not apply is worse than no limit.
 */
const MEDIA_MAX = 10;
const DRAFT_KEY = "spenny_post_draft_v1";

const AUDIENCE_BADGE = {
    membership: "Members Only",
    subscription: "Subscribers Only",
    support: "Supporters Only",
    public: "Shoutout",
};

// Best-effort preview URL from whatever the creator has chosen so far.
const previewImageUrl = (rewardImage, isAiImage, item) => {
    if (isAiImage) return isAiImage; // AI path stores a ready URL
    if (rewardImage) {
        // A freshly uploaded file is a bare Uploadcare UUID; an edited post may already
        // carry a transformed path — only prefix the bare UUID form.
        return /^[0-9a-f-]{36}$/i.test(rewardImage)
            ? `https://ucarecdn.com/${rewardImage}/-/format/jpeg/`
            : `https://ucarecdn.com/${rewardImage}`;
    }
    return item?.image_url || "";
};

/**
 * An instant → the value a `datetime-local` input wants, in the creator's own
 * timezone.
 *
 * ⚠️ `toISOString().slice(0,16)` is the obvious version and it is wrong: it
 * yields UTC, so a creator in IST who scheduled 9am would reopen the form and be
 * shown 3:30am. The offset has to be subtracted first.
 */
const toLocalInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};

/**
 * The media a composer should OPEN with: an edited post's own files, nothing at
 * all for a new post.
 *
 * ⚠️ `Popup` unmounts its children on close but `AddPost` itself stays mounted,
 * so `mediaList` survives — a creator who published, or simply closed the sheet,
 * reopened it to find the previous post's images still attached. Every open
 * re-seeds from here rather than trusting whatever the last session left behind.
 */
const mediaFromItem = (item) => {
    if (!item) return [];
    if (Array.isArray(item.media) && item.media.length > 0) return item.media;
    if (item.image) {
        return [
            {
                uuid: item.image,
                mimeType: item.type === "video" ? "video/mp4" : "image/jpeg",
                isImage: item.type !== "video",
                isVideo: item.type === "video",
                name: "File",
            },
        ];
    }
    return [];
};

/**
 * Fires once when the composer's contents actually mount (i.e. the sheet opened)
 * and once when they unmount (it closed).
 *
 * ⚠️ Neither moment is observable from `AddPost` itself: in uncontrolled mode
 * `Popup` owns the open flag, so `modalAction` is `undefined` the whole time and
 * an effect watching it never sees a thing.
 */
const OnOpen = ({ onOpen, onClose }) => {
    const openRef = useRef(onOpen);
    const closeRef = useRef(onClose);
    openRef.current = onOpen;
    closeRef.current = onClose;

    useEffect(() => {
        openRef.current?.();
        return () => closeRef.current?.();
    }, []);

    return null;
};

const AUDIENCES = [
    {
        value: "membership",
        label: "Members",
        hint: "Only people on one of your membership tiers",
    },
    {
        value: "subscription",
        label: "Subscribers",
        hint: "Only people on an active content subscription",
    },
    {
        value: "support",
        label: "Supporters",
        hint: "Anyone who has bought from or supported you",
    },
    // "Shoutouts" was already a filter on the feed but there was no way to publish to it,
    // so that tab was permanently empty.
    {
        value: "public",
        label: "Shoutout (public)",
        hint: "Visible to everyone, including visitors",
    },
];

export default function AddPost({
 item,
 text,
 classes,
 isEdit,
 title,
 open,
 onClose,
 highlight,
}) {
    const { auth } = usePage().props;
    // Controlled mode: the parent owns open/close. Used for the edit modal,
    // which must live OUTSIDE the post's dropdown menu — rendered inside it,
    // selecting "Edit Post" closed the menu and unmounted this component
    // before its modal could open, so editing silently did nothing.
    const controlled = open !== undefined;
    const [close, setClose] = useState();
    const modalAction = controlled ? open : close;
    const finishClose = () => {
        if (controlled) {
            onClose?.();
        } else {
            setClose(false);
            setTimeout(() => setClose(), 100);
        }
    };
    /**
     * The composer owns its own close control, because the page's header holds
     * it — Popup's floating white circle would land on top of the Publish button.
     * `hideclose` suppresses Popup's version.
     */
    const closeComposer = () => finishClose();
    const { errorsHandling } = useAlerts();
    const [mediaList, setMediaList] = useState([]);
    const [isAiImage, setIsAiImage] = useState(false);

    const uploaderRef = useRef();
    const titleInputRef = useRef();
    const resetUploader = () => uploaderRef.current?.reset?.();

    /**
     * 🚨 The Uploadcare context name must be UNIQUE PER MOUNT, and it was the
     * literal `add-post-context` on every instance. `feed/Post.jsx` renders an
     * `AddPost` per post for its edit sheet, so a profile feed carried a dozen
     * `lr-config` elements all claiming one context — the blocks resolve a context
     * by that name, so the second registration onto an existing name left the
     * uploader rendering as an empty box with no drop area at all.
     *
     * The sequence number moves on every close, so reopening the same composer
     * builds a fresh context rather than reusing one whose collection and preview
     * step were already settled.
     */
    const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
    const [openSeq, setOpenSeq] = useState(0);
    const uploaderCtx = `add-post-${instanceId}-${openSeq}`;
    const titleFieldId = `${instanceId}-post-title`;

    const handleComposerOpen = () => {
        // Media never carries over between sessions — see `mediaFromItem`.
        setMediaList(mediaFromItem(item));
        setIsAiImage(false);
        setShowPreview(false);
        setTitleTouched(false);
        resetUploader();
    };

    const handleComposerClose = () => setOpenSeq((n) => n + 1);

    const getAIImage = (e) => {
        const aiImg = {
            uuid: e.uuid + "/-/text_align/left/center/-/font/10/fff/-/text/80px8p/8p,100p/Made%20with%20AI%20/-/format/jpeg/-/preview/",
            mimeType: 'image/jpeg',
            isImage: true,
            isVideo: false,
            name: 'AI Generated Image',
            url: e.url
        };
        setMediaList((prev) => [...prev, aiImg]);
        setIsAiImage(true);
    };

    const getfile = async (files) => {
        const fileArray = Array.isArray(files) ? files : [files];
        setMediaList((prev) => {
            // ⚠️ Dedupe by uuid. The uploader can hand the same entry back more than
            // once for a single file, and a plain append then rendered it as two
            // thumbnails — the creator sees a photo they added once appearing twice
            // and reasonably assumes it uploaded twice. It is ONE stored file either
            // way (one uuid), so this is a display fault, not a second upload.
 const merged = [...prev, ...fileArray].filter((media, i, all) => {
 const id = media?.uuid || media?.url;
 if (!id) return true;
 return all.findIndex((m) => (m?.uuid || m?.url) === id) === i;
 });
            if (merged.length > MEDIA_MAX) {
                // Said out loud: silently dropping files the creator watched
                // upload is how a post ships missing half its photos.
                toast.error(`You can add up to ${MEDIA_MAX} images or videos — the rest were not added.`);
            }
            return merged.slice(0, MEDIA_MAX);
        });
        setIsAiImage(false);
    };

    const [data, setData] = useState({
        for_module: item?.for_module || "membership",
        title: item?.title || "",
        content: item?.content || "",
        scheduled_at: toLocalInput(item?.scheduled_at),
    });
    const [showPreview, setShowPreview] = useState(false);
    // The headline error only appears once the creator has left the field or tried
    // to publish — a form that is red before it has been touched reads as broken.
    const [titleTouched, setTitleTouched] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);
    const [scheduleOn, setScheduleOn] = useState(Boolean(item?.is_scheduled));

    // The earliest the picker will accept, in its own local-wall-clock format.
    const minSchedule = toLocalInput(new Date());

    const toggleSchedule = (on) => {
        setScheduleOn(on);
        // Clearing the field as well as the toggle: leaving a stale date behind
        // an unticked box is how a creator "publishes now" and finds the post
        // queued for next Tuesday.
        setData((d) => ({ ...d, scheduled_at: on ? d.scheduled_at : "" }));
    };

    useEffect(() => {
        if (item) {
            setScheduleOn(Boolean(item?.is_scheduled));
            setData({
                for_module: item?.for_module || "membership",
                title: item?.title || "",
                content: item?.content || "",
                scheduled_at: toLocalInput(item?.scheduled_at),
            });
        }
        setMediaList(mediaFromItem(item));
    }, [item]);

    // Draft autosave — new posts only. A stray tap outside the modal used to wipe
    // everything the creator had typed; now it comes back on reopen.
    useEffect(() => {
        if (isEdit) return;
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const draft = JSON.parse(raw);
            if (draft?.title || draft?.content) {
                setData((d) => ({ ...d, ...draft }));
                setDraftRestored(true);
            }
        } catch {
            /* ignore malformed draft */
        }
    }, [isEdit]);

    useEffect(() => {
        if (isEdit) return;
        const hasContent = data.title.trim() || data.content.trim();
        try {
            if (hasContent) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            } else {
                localStorage.removeItem(DRAFT_KEY);
            }
        } catch {
            /* storage unavailable — preview/submit still work */
        }
    }, [data, isEdit]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            /* ignore */
        }
        setDraftRestored(false);
    };

    const handleInput = (e) =>
        setData({ ...data, [e.target.name]: e.target.value });

    const [loading, setLoading] = useState(false);

    // Every post needs an image — a members-only feed is meant to give
    // subscribers something to look at, not a wall of text. The body copy is
    // optional; the headline is NOT.
    //
    // ⚠️ The headline is required on the server too. It is what the post's URL is
    // built from, and an untitled post used to fall back to the literal slug
    // `post` and 500 on the unique index. Do not relax one side without the other:
    // a field the form calls optional and the server rejects reads as a broken
    // post button with no explanation.
    const hasMedia = mediaList.length > 0;
 const hasTitle = data.title.trim().length > 0;
 const canSubmit = hasMedia && hasTitle;
 const showTitleError = titleTouched && !hasTitle;

    // ⚠️ This line is the ONLY explanation a creator gets for a dead Publish
    // button — `submitPost`'s "give your post a title" toast can never fire,
    // because the button guarding it is disabled. It used to be hardcoded to
    // "Add an image or video to publish.", so a creator who had attached an
    // image and forgotten the headline was told to attach an image they could
    // see was already there, with nothing marking the headline. Name the thing
    // that is actually missing.
 const blockReason = !hasTitle && !hasMedia
 ? "Add a headline and an image or video to publish."
 : !hasTitle
 ? "Give your post a headline to publish."
 : !hasMedia
 ? "Add an image or video to publish."
 : "Checked before your audience sees it.";

    const submitPost = (e) => {
        e && e.preventDefault();

 if (!hasTitle) {
 // Mark it AND move the cursor there: the button lives in a black header on
 // desktop and at the foot of the flow on a phone, so a toast alone leaves the
 // creator hunting for which field it meant.
 setTitleTouched(true);
 titleInputRef.current?.focus();
 toast.error("Give your post a headline before posting.");
 return false;
 }

        if (!hasMedia) {
            toast.error("Add at least one image or video before posting.");
            return false;
        }

        if (scheduleOn && !data.scheduled_at) {
            toast.error("Pick when this post should publish, or turn off Publish later.");
            return false;
        }

        setLoading(true);
        axios
            .post(isEdit ? `/post/edit/${item.uuid}` : "/post/save", {
                ...data,
                title: data.title.trim(),
                content: data.content.trim(),
                image: mediaList[0]?.uuid || null,
                media: mediaList,
                type: mediaList.some(m => m.isVideo) ? "video" : "image",
                ai_generated: isAiImage ? 1 : item?.ai_generated ? 1 : 0,
                // ⚠️ Sent as a full ISO instant, never the raw picker string. The
                // input has no timezone, so a bare "2026-08-10T09:00" is read
                // against the SERVER's clock — nobody's 9am. `new Date(...)` on
                // the picker value parses it as local, which is what was meant.
                scheduled_at:
                    scheduleOn && data.scheduled_at
                        ? new Date(data.scheduled_at).toISOString()
                        : null,
            })
            .then((resp) => {
                if (resp.data.status) {
                    // `setRewardImage` was left behind by an earlier refactor and no
                    // longer exists, so this whole success block threw a
                    // ReferenceError on every save. The throw landed in .catch(),
                    // which showed a generic error and left the modal open — the post
                    // HAD saved (the server answered 200), so it looked like "update
                    // works but the popup never closes".
                    setIsAiImage(false);
                    setScheduleOn(false);
                    setData({
                        for_module: data.for_module,
                        title: "",
                        content: "",
                        scheduled_at: "",
                    });
                    setShowPreview(false);
                    setTitleTouched(false);
                    // ⚠️ Clearing the uploader is not clearing the composer. The
                    // thumbnails are rendered from `mediaList`, which is this
                    // component's own state and survives the sheet closing — so a
                    // creator who published came back to their last post's images
                    // still attached and published them twice.
                    setMediaList([]);
                    clearDraft();
                    resetUploader();

                    toast.success(resp.data.msg);
                    finishClose();
                    window.dispatchEvent(new Event("closeAddOptions"));

                    // An edit must stay where the creator was — the post detail
                    // page edits too, and sending them to the profile feed read
                    // as "the modal is stuck and the page jumped".
                    if (isEdit) {
                        // Retitling changes the post's slug. On the post's own
                        // page that makes the address in the bar stale, so move
                        // to the new one (replace: the old URL is the same post,
                        // it does not deserve its own history entry).
                        const nextSlug = resp.data.slug;
                        const onThisPost =
                            typeof window !== "undefined" &&
                            window.location.pathname.includes("/post/");

                        if (onThisPost && nextSlug && !window.location.pathname.endsWith(`/post/${nextSlug}`)) {
                            router.visit(
                                `/${item?.user?.username || auth.user.username}/post/${nextSlug}`,
                                { replace: true, preserveScroll: true },
                            );
                        } else {
                            router.reload({ preserveScroll: true });
                        }
                    } else {
                        router.visit(
                            route("user.show", {
                                username: auth.user.username,
                                page: "feed",
                            }),
                            {
                                preserveScroll: true,
                            },
                        );
                    }
                } else {
                    toast.error(resp.data.msg);
                }
                setLoading(false);
            })
            .catch((_err) => {
                setLoading(false);
                // Blocked words and moderation refusals now come back as 422 JSON with the
                // real reason — surface it instead of a generic failure.
                const msg = _err?.response?.data?.msg;
                if (msg) {
                    toast.error(msg);
                } else {
                    errorsHandling(_err);
                }
            });
    };

    /**
     * `highlight` is used on the add-item chooser, where this row is the only
     * one that is not a way to LIST something — it is the one that keeps a
     * creator's recurring income collecting. `PostingCadenceService` pauses a
     * creator's active Bill + Membership subscriptions (Stripe
     * `pause_collection`) when they fall below the member-post threshold, so a
     * creator scanning six identical "sell X" rows has no way to tell that this
     * one is the load-bearing one.
     *
     * ⚠️ The copy states NO numbers. The threshold and the window live in
     * `PostingCadenceService::MIN_POSTS` / `WINDOW_DAYS` and are surfaced with
     * their real values by `statusFor()` (activity banner, widget,
     * `/creator/activity`). Retyping "3 posts / 30 days" here is a second copy
     * of a rule that pauses real income — it would drift the day the config
     * moves, on a screen with nothing to correct it.
     */
    const AddItem = () => (
        <div className="flex items-center">
 <div
 className={`p-1 rounded-box-sm border-2 border-black flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px] ${
 highlight ? "bg-white" : "bg-pink-100"
 }`}
 >
                <FaPenNib color="var(--pink)" size="1.5rem" />
            </div>
            <div className="ps-3 text-start">
 {highlight && (
 <span className="inline-block mb-1 bg-[#05EFB8] border-2 border-black rounded-full px-2.5 py-0.5 text-[12px] md:text-[12px] font-black uppercase tracking-wider text-black leading-none">
 Keeps payments active
 </span>
 )}
 {/* Same row grammar as the rest of the add-item chooser. */}
 <h2 className="font-gulfs text-base md:text-xl !font-light font-black text-black uppercase tracking-normal md:tracking-wide leading-tight">
                    Post Something
                </h2>
 <p className="text-sm font-bold text-gray-700">
                    Share an update, photo or note
                </p>
 {highlight && (
 <p className="text-xs md:text-sm font-poppins font-semibold text-black/70 mt-1 leading-snug">
 Keep posting for members or your subscription payments
 pause.
 </p>
 )}
            </div>
        </div>
    );

    const selectedAudience = AUDIENCES.find((a) => a.value === data.for_module);

    const submitLabel = isEdit
        ? loading
            ? "Updating…"
            : "Update post"
        : loading
          ? "Posting…"
          : scheduleOn
            ? "Schedule post"
            : "Publish post";

    /**
     * The card the audience will see — same frame, same badge position, same
     * carousel, same body formatting.
     *
     * Held in a variable because it renders in two places: behind the Preview
     * toggle on a phone, and permanently in the right column on desktop. A second
     * copy of this markup would drift, and the whole point of the preview is that
     * it matches what publishes.
     */
    const previewBody = (
        <>
            <div className="flex items-center gap-3 mb-3">
                <img
                    src={auth?.user?.avatar_url || "/assets/siteicon.png"}
                    alt=""
                    className="author-img w-[46px] h-[46px] rounded-full border-[3px] border-black object-cover"
                />
                <div className="min-w-0">
                    <p className="font-black capitalize tracking-wider leading-tight truncate">
                        {auth?.user?.name || "You"}
                    </p>
                    <p className="text-xs text-gray-600 font-bold">
                        {scheduleOn && data.scheduled_at
                            ? new Date(data.scheduled_at).toLocaleString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                  hour: "numeric",
                                  minute: "2-digit",
                              })
                            : "Just now"}
                    </p>
                </div>
            </div>

            {mediaList.length > 0 ? (
                <div className="post-images relative w-full border-[3px] border-black rounded-box-sm overflow-hidden">
                    <span className="bg-[#A2E4B8] border-[3px] border-black font-black absolute z-10 py-2 px-4 top-3 right-3 uppercase text-xs text-black rounded-box-sm">
                        {AUDIENCE_BADGE[data.for_module]}
                    </span>
                    <PostMediaCarousel
                        items={mediaList}
                        posterFallback={auth?.user?.avatar_url}
                        heightClass="h-[240px] md:h-[300px]"
                        rounded=""
                    />
                </div>
            ) : (
                <span className="inline-block bg-[#A2E4B8] border-[3px] border-black font-black py-1.5 px-3 uppercase text-xs text-black rounded-box-sm">
                    {AUDIENCE_BADGE[data.for_module]}
                </span>
            )}

            {data.title.trim() ? (
                <p className="text-black font-black mt-4 mb-2 uppercase tracking-wide">
                    {data.title.trim()}
                </p>
            ) : null}
            {data.content.trim() ? (
                <p className="text-gray-800 font-normal mt-2 text-sm md:text-base leading-relaxed whitespace-pre-line">
                    {formatPostContent(data.content.trim())}
                </p>
            ) : null}

            <p className="text-xs text-gray-500 mt-4">
                Preview only — your post is checked before your audience sees it.
                Tagged creators are notified once it goes live.
            </p>
        </>
    );

    return (
        <Popup
            modalclass=""
            space="6"
            size="xl"
            fullscreen
            hidecontrols
            hideclose
            action={modalAction}
            onHide={controlled ? onClose : undefined}
            // ⚠️ `bg-white` is dropped when highlighted rather than overridden by
            // the caller — two background utilities of equal specificity are
            // resolved by stylesheet order, not by which came last in the string,
            // so an override here would be a coin toss at build time.
 classes={`w-full addop ${highlight ? "" : "bg-white"} rounded-box py-2 px-3 ${classes}`}
            // Controlled mode has no trigger of its own — the parent opens it.
            text={controlled ? undefined : text ? text : <AddItem />}
        >
            {/* Full page, not a dialog. Writing a post is the creator's main job
                on this platform and it was being done in a 576px box with the
                composer, the uploader, the audience picker and the schedule all
                fighting one column — the submit button sat two scrolls below the
                thing being written.

                `hidecontrols`: the fake mac-window title bar is a dialog device.
                On a page that IS the window it is 80px of decoration above the
                creator's own headline. */}
            <div className="flex min-h-0 flex-1 flex-col bg-[#F2EFE7]">
                {/* Popup unmounts its children on close, so this is the composer's
                    real open/close signal — see `OnOpen`. */}
                <OnOpen onOpen={handleComposerOpen} onClose={handleComposerClose} />
                {/* Black bar: this is the one moment the composer owns the whole
                    screen, and a white header on a near-white page has nothing to
                    hold it down. */}
 {/* ⚠️ Installed as a PWA there is no browser chrome, so a full-bleed
 header runs under the status bar and the clock lands on the title.
 The black bleeds to the screen edge; only its content is inset.
 Same treatment as `Sheet.jsx`. */}
 <header
 className="shrink-0 border-b-[3px] border-black bg-black px-4 py-3 sm:px-6"
 style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
 >
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={closeComposer}
                            aria-label="Close"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/25 text-white transition-colors hover:border-white hover:bg-white hover:text-black"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="min-w-0 flex-1">
                            <h2 className="truncate font-GillSans text-lg uppercase leading-none tracking-wide text-white sm:text-2xl">
                                {title ? title : isEdit ? "Edit post" : "New post"}
                            </h2>
 <p className="mt-1 truncate text-[12px] font-black uppercase tracking-[0.16em] text-white/60">
                                {selectedAudience
                                    ? `To ${selectedAudience.label}`
                                    : "Choose an audience"}
                                {scheduleOn && data.scheduled_at ? " · Scheduled" : ""}
                            </p>
                        </div>

                        {canSubmit && (
                            <button
                                type="button"
                                onClick={() => setShowPreview((v) => !v)}
 className="h-11 shrink-0 rounded-box-sm border-2 border-white/25 px-4 text-[12px] font-black uppercase tracking-[0.14em] text-white hover:border-white lg:hidden"
                            >
                                {showPreview ? "Edit" : "Preview"}
                            </button>
                        )}

                        {/* ⚠️ Not LoaderButton: it renders its spinner whenever
                            `disabled` is set, so an empty composer showed a blank
                            pill that read as "already saving", and it hardcodes a
                            radius that fights the house tokens. */}
                        <button
                            type="button"
                            onClick={submitPost}
                            disabled={loading || !canSubmit}
 className={`hidden h-11 shrink-0 items-center rounded-box-sm border-2 border-black px-6 text-xs font-black uppercase tracking-[0.14em] transition-colors duration-200 lg:inline-flex ${
                                loading || !canSubmit
 ? "cursor-not-allowed bg-white/25 text-white/60"
 : "bg-[#FF007F] text-black hover:brightness-110 active:brightness-95"
                            }`}
                        >
                            {submitLabel}
                        </button>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto customScrollbar">
                    {/* pb-28 on phones: the app's own fixed bottom navigation
                        sits over this panel, so without it the last control in
                        the flow is permanently underneath the nav bar. */}
                    <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:py-8 lg:pb-8">
                        <div className="min-w-0">

            {draftRestored && !isEdit && (
                <div className="mb-4 flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-box-sm px-3 py-2 text-sm text-blue-800">
                    <span>📝 Draft restored from last time.</span>
                    <button
                        type="button"
                        onClick={() => {
                            setData({
                                for_module: data.for_module,
                                title: "",
                                content: "",
                                scheduled_at: "",
                            });
                            setScheduleOn(false);
                            clearDraft();
                        }}
                        className="font-bold underline min-h-[44px] px-1"
                    >
                        Discard
                    </button>
                </div>
            )}

            {/* Live preview — the same card the audience will see: same frame,
                same badge position, same carousel, same body formatting. The old
                preview stacked every image full-width in a grid, so a five-image
                post looked nothing like the one that got published.

                Phone only: on desktop it lives permanently in the right column,
                where a toggle would only hide something there is room for. */}
            {showPreview ? (
                <div className="post-wrap bg-[#fdfbf7] rounded-box p-4 border-[3px] border-black lg:hidden">
                    {previewBody}
                </div>
            ) : null}

            {/* ONE SHEET, not four floating fields.
                The old form set every input in its own pale grey rounded box, so
                a page whose whole job is writing looked like a settings screen
                and the eye had to find the writing area among the furniture.
                Title, body and media now live inside a single bordered sheet with
                hairline rules between them — the composer is literally a page. */}
            <div className={showPreview ? "hidden lg:block" : ""}>
                {/* ⚠️ `overflow-hidden` is load-bearing. The media block is a
                    full-bleed child with square corners, so without clipping it
                    pokes through the sheet's radius and reads as a stray dark
 edge along the bottom. `` because several legacy
 stylesheets attach an offset to black-bordered boxes. */}
 <div className="overflow-hidden rounded-box border-[3px] border-black bg-white ">
                    {/* ⚠️ The headline is MANDATORY on the server (it is what the
                        post's URL, its feed card and every share preview are built
                        from) and this field announced none of that — it was a
                        borderless box whose only clue was a grey placeholder, so a
                        creator typed their post into the body, found Publish dead
                        and had nothing telling them why. It now carries the same
                        eyebrow label + pink asterisk as the media block below it,
                        which is this sheet's existing grammar for a required field. */}
                    <div className="px-4 pt-4 sm:px-6 sm:pt-6">
                        <label
                            htmlFor={titleFieldId}
                            className={`block text-[12px] font-black uppercase tracking-[0.16em] ${
                                showTitleError ? "text-[#B3123F]" : "text-black/60"
                            }`}
                        >
                            Headline <span className="text-[#FF007F]">*</span>
                        </label>
                        <input
                            id={titleFieldId}
                            ref={titleInputRef}
                            onChange={handleInput}
                            onBlur={() => setTitleTouched(true)}
                            value={data.title}
                            name="title"
                            maxLength={TITLE_MAX}
                            required
                            aria-invalid={showTitleError || undefined}
                            aria-describedby={`${titleFieldId}-hint`}
 placeholder="Give it a headline"
                            /* ⚠️ NOT font-GillSans. It is a heavy display face
                               built for short uppercase headings; at input size,
                               in sentence case, a placeholder set in it reads as
                               a broken graphic rather than a field you type in.
                               Display type belongs in the page header, not in the
                               thing the creator is writing. */
 className="mt-1 w-full border-0 bg-transparent p-0 text-2xl font-bold leading-snug text-black placeholder:font-medium placeholder:text-black/60 focus:outline-none focus:ring-0 sm:text-[28px]"
                        />
                        <div className="mt-1 flex items-start justify-between gap-3">
                            <p
                                id={`${titleFieldId}-hint`}
                                className={`text-xs ${showTitleError ? "font-bold text-[#B3123F]" : "text-black/60"}`}
                            >
                                {showTitleError
                                    ? "Add a headline — a post cannot be published without one."
                                    : "Required. This is the post's title and its link."}
                            </p>
                            {data.title.length > TITLE_MAX - 30 && (
 <span className="shrink-0 text-xs text-black/60">
                                {data.title.length}/{TITLE_MAX}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 border-t border-black/10 px-4 pt-3 sm:px-6">
                        <MentionTextarea
                            onChange={handleInput}
                            value={data.content}
                            name="content"
                            maxLength={CONTENT_MAX}
                            placeholder="Say something to the people who pay for this…"
 className="h-[200px] w-full resize-none border-0 bg-transparent p-0 text-[17px] leading-relaxed text-black placeholder:text-black/60 focus:outline-none focus:ring-0 lg:h-[280px]"
                        />
                        <div className="mt-2 flex items-start justify-between gap-3 pb-3">
 <p className="text-xs text-black/60">
                                Type <span className="font-bold text-[#FF007F]">@</span> to tag a
                                creator — they get a notification and their name links to their
                                page. Links you paste become clickable.
                            </p>
                            {data.content.length > 0 && (
 <span className="shrink-0 text-xs text-black/60">
                                    {data.content.length}/{CONTENT_MAX}
                                </span>
                            )}
                        </div>
                    </div>

 <div className="choosemedia bg-[#FAF8F3] px-4 py-4 sm:px-6">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
 <p className="text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                            Images or video <span className="text-[#FF007F]">*</span>
                        </p>
                        {/* The count leads, because it is the number the creator
                            is tracking once they start adding files; the limit is
                            context for it rather than a rule announced at them. */}
 <p className="text-[12px] font-semibold text-black/60">
                            {mediaList.length > 0
                                ? `${mediaList.length} of ${MEDIA_MAX} added`
                                : `Add up to ${MEDIA_MAX}`}
                        </p>
                    </div>

                    {mediaList.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            {mediaList.map((media, idx) => {
                                const url = media.uuid.startsWith('http')
                                    ? media.uuid
                                    : `https://ucarecdn.com/${media.uuid}/-/preview/200x200/`;
                                return (
                                    <div key={idx} className="relative border-2 border-black rounded-box-sm overflow-hidden aspect-square bg-gray-100 flex items-center justify-center group">
                                        {media.isVideo ? (
                                            /* ⚠️ A PLAIN JS COMMENT, not `{/* … *\/}`.
 Inside a ternary's parenthesised branch the
 braces are an OBJECT LITERAL, not a JSX
 comment — `{/* … *\/}<video` is a syntax error
 that fails the whole Vite build. The `{…}`
 form is only a comment in children position.

 ⚠️ preload="none". A grid of video tiles at
 preload="metadata" fetches a range of every
 file the creator has added, on every render of
 the composer — bytes nobody asked for. The tile
 stays dark and the VIDEO badge below says what
 it is. */
                                            <video
                                                src={media.uuid.startsWith('http') ? media.uuid : `https://ucarecdn.com/${media.uuid}/`}
                                                className="w-full h-full object-cover"
                                                muted
 preload="none"
                                            />
                                        ) : (
                                            <img
                                                src={url}
                                                alt={media.name || "Media"}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setMediaList((prev) => prev.filter((_, i) => i !== idx))}
 className="absolute top-1 right-1 bg-red-600 border border-black hover:bg-red-800 text-white rounded-full p-1 leading-none text-xs font-black min-w-[24px] min-h-[24px]"
                                            title="Remove media"
                                        >
                                            ✕
                                        </button>
 <span className="absolute bottom-1 left-1 bg-black text-white text-[12px] px-1.5 py-0.5 rounded-box-sm">
                                            {media.isVideo ? "📹 VIDEO" : "🖼️ IMAGE"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="relative">
                        <GlobalUploader
                            ctxName={uploaderCtx}
                            ref={uploaderRef}
                            view={false}
                            type="minimal"
                            imgonly={false}
                            multiple={true}
                            accept="image/*,video/*"
                            sendFile={getfile}
                            options={st.post}
                        />
                        {/* "Use AI" is switched off for now (14 Aug 2026, client
                            direction). Left in place rather than deleted — the
                            handler (`getAIImage`) and its watermarking transform
                            are still wired, so switching it back on is uncommenting
                            this block and its import at the top of the file.

                            ⚠️ Only absolute from `sm`. Overlaid on a narrow phone it
                            landed on top of the uploader's own "Choose file" label —
                            the two controls were unreadable and the wrong one was
                            easy to hit.

                        <div className="mt-2 flex justify-center sm:absolute sm:right-12 sm:top-[14px] sm:mt-0 sm:block">
                            <ImageGenerationWithAI
                                classes={`button bg-pink table text-[12px] sm:flex m-auto m-sm-0 hover:opacity-80`}
                                update={getAIImage}
                            />
                        </div>
                        */}
                    </div>
                </div>
                </div>
            </div>
                        </div>

                        {/* Decisions, not writing: who gets it and when. On a
                            phone they follow the composer; on desktop they sit
                            beside it with the preview, so nothing being decided
                            is off screen while it is decided. */}
                        <aside className="min-w-0 space-y-4 lg:sticky lg:top-8 lg:self-start">
                            {/* One card per decision, each with the same eyebrow,
                                border and radius. The audience picker is a row of
                                choices rather than a dropdown: there are four, the
                                difference between them is who pays, and a select
                                hides three of the four behind a click. */}
 <section className="rounded-box border-[3px] border-black bg-white p-4 ">
 <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                                    Who sees this
                                </h3>

                                <div className="mt-3 space-y-2">
                                    {AUDIENCES.map((a) => {
                                        const active = data.for_module === a.value;
                                        return (
                                            <label
                                                key={a.value}
                                                className={`flex cursor-pointer items-start gap-3 rounded-box-sm border-2 p-3 transition-colors ${
                                                    active
                                                        ? "border-black bg-[#A2E4B8]"
                                                        : "border-black/15 bg-white hover:border-black/40"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="for_module"
                                                    value={a.value}
                                                    checked={active}
                                                    onChange={handleInput}
                                                    className="mt-0.5 h-4 w-4 shrink-0 border-black"
                                                    style={{ color: "#000" }}
                                                />
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-black uppercase tracking-wide text-black">
                                                        {a.label}
                                                    </span>
 <span className="mt-0.5 block text-xs leading-snug text-black/60">
                                                        {a.hint}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* Members / Subscribers posts are the ones that count towards
                                    keeping recurring subscriptions unpaused — say so where the
                                    choice is made. */}
                                {(data.for_module === "membership" ||
                                    data.for_module === "subscription") && (
                                    <p className="mt-3 border-t border-black/10 pt-3 text-xs font-semibold text-[#1E7A45]">
                                        Counts towards the member posts that keep your
                                        subscription payments running.
                                    </p>
                                )}
                            </section>

                            {/* Scheduling. Off by default — publishing now is what most
                                posts do, and a date field sitting open invites a creator
                                to fill it in without meaning to. */}
 <section className="rounded-box border-[3px] border-black bg-white p-4 ">
                                <label className="flex cursor-pointer items-center justify-between gap-3">
                                    <span className="min-w-0">
 <span className="block text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                                            When
                                        </span>
                                        <span className="mt-0.5 block text-sm font-black uppercase tracking-wide text-black">
                                            {scheduleOn ? "Publish later" : "Publish now"}
                                        </span>
                                    </span>
                                    {/* A real switch, not a lone checkbox in a big
                                        empty box — this is a mode, and it reads as one. */}
                                    <span
                                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-black transition-colors ${
                                            scheduleOn ? "bg-[#FF007F]" : "bg-white"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={scheduleOn}
                                            onChange={(e) => toggleSchedule(e.target.checked)}
                                            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                        <span
                                            className={`pointer-events-none block h-4 w-4 rounded-full border-2 border-black bg-white transition-transform ${
                                                scheduleOn ? "translate-x-[26px]" : "translate-x-1.5"
                                            }`}
                                        />
                                    </span>
                                </label>

                                {scheduleOn && (
                                    <div className="mt-3 border-t border-black/10 pt-3">
                                        <input
                                            type="datetime-local"
                                            value={data.scheduled_at || ""}
                                            min={minSchedule}
                                            onChange={(e) =>
                                                setData({
                                                    ...data,
                                                    scheduled_at: e.target.value,
                                                })
                                            }
                                            className="block w-full rounded-box-sm border-2 border-black px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-0"
                                        />
 <p className="mt-2 text-xs text-black/60">
                                            Goes live at this time in your own timezone,
                                            once it has been checked. You can change or
                                            cancel it until then.
                                        </p>
                                    </div>
                                )}
                            </section>

 <section className="hidden overflow-hidden rounded-box border-[3px] border-black bg-white lg:block">
 <h3 className="border-b border-black/10 px-4 py-3 text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                                    Preview
                                </h3>
                                <div className="bg-[#fdfbf7] p-4">{previewBody}</div>
                            </section>
                        </aside>

                        {/* ⚠️ NOT sticky. A fixed footer here sat on top of the
                            app's own fixed bottom navigation, so the publish
                            button and the nav bar overlapped and the button was
                            half-covered. It is the last thing in the flow
                            instead, which is also where it belongs: the creator
                            reaches it after choosing the audience and the time.
                            Desktop still has the action in the header. */}
                        <div className="lg:hidden">
                            <button
                                type="button"
                                onClick={submitPost}
                                disabled={loading || !canSubmit}
                                className={`flex min-h-[52px] w-full items-center justify-center rounded-box-sm border-[3px] border-black text-sm font-black uppercase tracking-[0.14em] ${
                                    loading || !canSubmit
 ? "cursor-not-allowed bg-gray-200 text-black/60"
 : "bg-[#FF007F] text-black"
                                }`}
                            >
                                {submitLabel}
                            </button>
 <p className="mt-2 text-center text-xs text-black/60">
 {blockReason}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Popup>
    );
}
