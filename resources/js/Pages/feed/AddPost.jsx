import { useEffect, useRef, useState } from "react";
import Popup from "@/Components/Popup";
import st from "../../../css/uploader.module.css";
import GlobalUploader from "@/uploadcare/Uploader";
import LoaderButton from "@/Components/LoaderButton";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAlerts } from "@/Components/Alerts";
import { FaPenNib } from "react-icons/fa6";
import ImageGenerationWithAI from "@/Components/ImageGenerationWithAI";
import { router, usePage } from "@inertiajs/react";
import MentionTextarea from "@/Components/MentionTextarea";
import PostMediaCarousel from "@/Components/PostMediaCarousel";
import { formatPostContent } from "./Post";

const TITLE_MAX = 150;
const CONTENT_MAX = 5000;
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

export default function AddPost({ item, text, classes, isEdit, title, open, onClose }) {
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
    const { errorsHandling } = useAlerts();
    const [mediaList, setMediaList] = useState([]);
    const [isAiImage, setIsAiImage] = useState(false);

    const uploaderRef = useRef();
    const resetUploader = () => uploaderRef.current?.reset?.();

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
        setMediaList((prev) => [...prev, ...fileArray]);
        setIsAiImage(false);
    };

    const [data, setData] = useState({
        for_module: item?.for_module || "membership",
        title: item?.title || "",
        content: item?.content || "",
    });
    const [showPreview, setShowPreview] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);

    useEffect(() => {
        if (item) {
            setData({
                for_module: item?.for_module || "membership",
                title: item?.title || "",
                content: item?.content || "",
            });
            if (item.media && Array.isArray(item.media)) {
                setMediaList(item.media);
            } else if (item.image) {
                setMediaList([{
                    uuid: item.image,
                    mimeType: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
                    isImage: item.type !== 'video',
                    isVideo: item.type === 'video',
                    name: 'File'
                }]);
            } else {
                setMediaList([]);
            }
        } else {
            setMediaList([]);
        }
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
    // subscribers something to look at, not a wall of text. The caption is
    // optional.
    const hasMedia = mediaList.length > 0;
    const canSubmit = hasMedia;

    const submitPost = (e) => {
        e && e.preventDefault();

        if (!hasMedia) {
            toast.error("Add at least one image or video before posting.");
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
                    setData({
                        for_module: data.for_module,
                        title: "",
                        content: "",
                    });
                    setShowPreview(false);
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

    const AddItem = () => (
        <div className="flex items-center">
            <div className="p-1 rounded-box-sm border-2 border-black  bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px]">
                <FaPenNib color="var(--pink)" size="1.5rem" />
            </div>
            <div className="ps-3 text-start">
                <h2 className="text-sm md:text-lg font-normal font-GillSans uppercase leading-tight">
                    Post Something
                </h2>
                <p className="text-sm font-poppins">
                    Share an update, photo or note
                </p>
            </div>
        </div>
    );

    const selectedAudience = AUDIENCES.find((a) => a.value === data.for_module);

    return (
        <Popup
            modalclass=""
            space="6"
            size="xl"
            action={modalAction}
            onHide={controlled ? onClose : undefined}
            classes={`w-full addop bg-white rounded-box py-2 px-3 ${classes}`}
            // Controlled mode has no trigger of its own — the parent opens it.
            text={controlled ? undefined : text ? text : <AddItem />}
        >
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-dark-500">
                    {title ? title : "Say Something"}
                </h2>
                {canSubmit && (
                    <button
                        type="button"
                        onClick={() => setShowPreview((v) => !v)}
                        className="text-sm font-bold underline text-[#FF007F] min-h-[44px] px-2"
                    >
                        {showPreview ? "Edit" : "Preview"}
                    </button>
                )}
            </div>

            {draftRestored && !isEdit && (
                <div className="mt-3 flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-box-sm px-3 py-2 text-sm text-blue-800">
                    <span>📝 Draft restored from last time.</span>
                    <button
                        type="button"
                        onClick={() => {
                            setData({
                                for_module: data.for_module,
                                title: "",
                                content: "",
                            });
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
                post looked nothing like the one that got published. */}
            {showPreview ? (
                <div className="mt-4 post-wrap bg-[#fdfbf7] rounded-box p-4 border-[3px] border-black">
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
                            <p className="text-xs text-gray-600 font-bold">Just now</p>
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
                </div>
            ) : null}

            <div className={`mt-1 ${showPreview ? "hidden" : ""}`}>
                <div className="mt-4">
                    <input
                        onChange={handleInput}
                        value={data.title}
                        name="title"
                        maxLength={TITLE_MAX}
                        placeholder="Post title (optional)"
                        className="text-normal border-gray-300 border px-3 py-3 text-lg text-gray-900 rounded-box-sm w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
                    />
                    {data.title.length > TITLE_MAX - 30 && (
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            {data.title.length}/{TITLE_MAX}
                        </p>
                    )}
                </div>

                <div className="mt-4">
                    <MentionTextarea
                        onChange={handleInput}
                        value={data.content}
                        name="content"
                        maxLength={CONTENT_MAX}
                        placeholder="Say something..."
                        className="text-lg border-gray-300 border h-[150px] w-full rounded-box-sm px-3 py-3 focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
                    />
                    <div className="mt-1 flex items-start justify-between gap-3">
                        <p className="text-xs text-gray-500">
                            Type <span className="font-bold text-[#FF007F]">@</span> to tag a
                            creator — they get a notification and their name links to their
                            page. Links you paste become clickable.
                        </p>
                        {data.content.length > 0 && (
                            <span className="shrink-0 text-xs text-gray-500">
                                {data.content.length}/{CONTENT_MAX}
                            </span>
                        )}
                    </div>

                </div>

                <div className="choosemedia mt-4 pt-2">
                    <p className="mb-2 font-bold text-black">
                        Add images or videos <span className="text-[#FF007F]">*</span>
                    </p>

                    {mediaList.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                            {mediaList.map((media, idx) => {
                                const url = media.uuid.startsWith('http') 
                                    ? media.uuid 
                                    : `https://ucarecdn.com/${media.uuid}/-/preview/200x200/`;
                                return (
                                    <div key={idx} className="relative border-2 border-black rounded-box-sm overflow-hidden aspect-square bg-gray-100 flex items-center justify-center group">
                                        {media.isVideo ? (
                                            <video 
                                                src={media.uuid.startsWith('http') ? media.uuid : `https://ucarecdn.com/${media.uuid}/`} 
                                                className="w-full h-full object-cover" 
                                                muted 
                                                preload="metadata"
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
                                            className="absolute top-1 right-1 bg-red-600 border border-black hover:bg-red-800 text-white rounded-full p-1 leading-none text-xs font-black shadow-md min-w-[24px] min-h-[24px]"
                                            title="Remove media"
                                        >
                                            ✕
                                        </button>
                                        <span className="absolute bottom-1 left-1 bg-black text-white text-[9px] px-1.5 py-0.5 rounded-box-sm">
                                            {media.isVideo ? "📹 VIDEO" : "🖼️ IMAGE"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="relative">
                        <GlobalUploader
                            ctxName="add-post-context"
                            ref={uploaderRef}
                            view={false}
                            type="minimal"
                            imgonly={false}
                            multiple={true}
                            accept="image/*,video/*"
                            sendFile={getfile}
                            options={st.post}
                        />
                        <div className="absolute top-[14px] right-12">
                            <ImageGenerationWithAI
                                classes={`button bg-pink table text-[10px] sm:flex m-auto m-sm-0 hover:opacity-80`}
                                update={getAIImage}
                            />
                        </div>
                    </div>
                </div>

                <p className="text-grey-500 mb-1 mt-4">Choose audience</p>
                <select
                    value={data.for_module}
                    onChange={handleInput}
                    name="for_module"
                    className="border-gray-300 border px-4 py-3 text-md w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-box-sm block"
                >
                    {AUDIENCES.map((a) => (
                        <option key={a.value} value={a.value}>
                            {a.label}
                        </option>
                    ))}
                </select>
                {selectedAudience && (
                    <p className="text-xs text-gray-500 mt-2">
                        {selectedAudience.hint}
                    </p>
                )}

                {/* Members / Subscribers posts are the ones that count towards keeping
                    recurring subscriptions unpaused — say so where the choice is made. */}
                {(data.for_module === "membership" ||
                    data.for_module === "subscription") && (
                    <p className="text-xs text-green-700 mt-2">
                        ✅ Counts towards your monthly member-posting
                        requirement.
                    </p>
                )}
            </div>

            <LoaderButton
                onClick={submitPost}
                disabled={loading || !canSubmit}
                className={`${!canSubmit ? "opacity-50 cursor-not-allowed" : ""} b mt-4 w-full`}
                spinnerclass="fill-red-600"
            >
                {isEdit
                    ? loading
                        ? "Updating.."
                        : "Update Post"
                    : loading
                      ? "Posting.."
                      : "Add New Post"}
            </LoaderButton>

            <p className="text-xs text-gray-500 mt-3 text-center">
                Posts are checked before they appear to your audience.
            </p>
        </Popup>
    );
}
