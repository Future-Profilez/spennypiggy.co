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

const TITLE_MAX = 150;
const CONTENT_MAX = 5000;

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

export default function AddPost({ item, text, classes, isEdit, title }) {
    const { auth } = usePage().props;
    const [close, setClose] = useState();
    const { errorsHandling } = useAlerts();
    const [rewardImage, setRewardImage] = useState(item?.image || "");
    const [isAiImage, setIsAiImage] = useState(false);

    const uploaderRef = useRef();
    const resetUploader = () => uploaderRef.current?.reset?.();

    const getAIImage = (e) => {
        setRewardImage(
            e.uuid +
                "/-/text_align/left/center/-/font/10/fff/-/text/80px8p/8p,100p/Made%20with%20AI%20/-/format/jpeg/-/preview/",
        );
        setIsAiImage(e.url);
    };

    const getfile = async (data) => {
        setRewardImage(data?.uuid);
        setIsAiImage(false);
    };

    const [data, setData] = useState({
        for_module: item?.for_module || "membership",
        title: item?.title || "",
        content: item?.content || "",
    });

    useEffect(() => {
        if (item) {
            setData({
                for_module: item?.for_module || "membership",
                title: item?.title || "",
                content: item?.content || "",
            });
            setRewardImage(item?.image || "");
        }
    }, [item]);

    const handleInput = (e) =>
        setData({ ...data, [e.target.name]: e.target.value });

    const [loading, setLoading] = useState(false);

    // A post needs an image OR some text — it used to demand an image every time, which
    // made a plain text update impossible and pushed creators to pad posts with stock art.
    const hasImage = !!rewardImage;
    const hasText =
        data.content.trim().length > 0 || data.title.trim().length > 0;
    const canSubmit = hasImage || hasText;

    const submitPost = (e) => {
        e && e.preventDefault();

        if (!canSubmit) {
            toast.error("Write something or add an image before posting.");
            return false;
        }

        setLoading(true);
        axios
            .post(isEdit ? `/post/edit/${item.uuid}` : "/post/save", {
                ...data,
                title: data.title.trim(),
                content: data.content.trim(),
                image: rewardImage || null,
                type: hasImage ? "image" : "blog",
                ai_generated: isAiImage ? 1 : item?.ai_generated ? 1 : 0,
            })
            .then((resp) => {
                if (resp.data.status) {
                    setRewardImage("");
                    setIsAiImage(false);
                    setData({
                        for_module: data.for_module,
                        title: "",
                        content: "",
                    });
                    resetUploader();

                    toast.success(resp.data.msg);
                    setClose(false);
                    window.dispatchEvent(new Event("closeAddOptions"));
                    setTimeout(() => setClose(), 100);

                    router.visit(
                        route("user.show", {
                            username: auth.user.username,
                            page: "feed",
                        }),
                        {
                            preserveScroll: true,
                        },
                    );
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
            <div className="p-1 rounded-box-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px]">
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
            size="md"
            action={close}
            classes={`w-full addop bg-white rounded-box py-2 px-3 ${classes}`}
            text={text ? text : <AddItem />}
        >
            <div className="flex items-center">
                <h2 className="text-xl font-bold text-dark-500">
                    {title ? title : "Say Something"}
                </h2>
            </div>

            <div className="mt-1">
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
                    <textarea
                        onChange={handleInput}
                        value={data.content}
                        name="content"
                        maxLength={CONTENT_MAX}
                        placeholder="Say something..."
                        className="text-lg border-gray-300 border h-[150px] w-full rounded-box-sm px-3 py-3 focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
                    />
                    {data.content.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            {data.content.length}/{CONTENT_MAX}
                        </p>
                    )}
                </div>

                <div className="chhoseimage mt-4 pt-2">
                    <p className="text-grey-400 mb-2">
                        Add an image (optional)
                    </p>

                    {isEdit && item?.image_url && !isAiImage ? (
                        <>
                            <div className="default-wish-img border relative mb-1 rounded-box-sm overflow-hidden">
                                <img
                                    src={item.image_url}
                                    alt="Current post"
                                    className="max-w-full h-auto"
                                />
                            </div>
                            <h2 className="w-full my-2 text-center">Or</h2>
                        </>
                    ) : null}

                    {isAiImage ? (
                        <div className="default-wish-img border relative mb-2 rounded-box-sm overflow-hidden">
                            <img
                                src={isAiImage}
                                alt="AI generated"
                                className="max-w-full h-auto"
                            />
                        </div>
                    ) : null}

                    <div className="relative">
                        <GlobalUploader
                            ctxName="add-post-context"
                            ref={uploaderRef}
                            view={false}
                            type="minimal"
                            imgonly={true}
                            accept="image/*"
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

                    {hasImage && (
                        <button
                            type="button"
                            onClick={() => {
                                setRewardImage("");
                                setIsAiImage(false);
                                resetUploader();
                            }}
                            className="mt-2 text-sm text-gray-600 underline min-h-[44px]"
                        >
                            Remove image
                        </button>
                    )}
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
