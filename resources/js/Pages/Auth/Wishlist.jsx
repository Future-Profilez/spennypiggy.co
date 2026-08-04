import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useEffect, useRef, useState } from "react";
import LoaderButton from "@/Components/LoaderButton";
import { router, useForm, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import { Disclosure, Transition } from "@headlessui/react";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import Popup from "@/Components/Popup";
import { Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import PriceFormat from "@/includes/PriceFormat";
import axios from "axios";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { FaRegHeart, FaChevronUp } from "react-icons/fa";
import { RiCloseLine, RiCheckDoubleLine } from "react-icons/ri";
import ContentFilePreview from "@/Components/ContentFilePreview";
import RewardEditor, {
    emptyReward,
    rewardFromItem,
    rewardToPayload,
    validateReward,
} from "@/Components/Reward/RewardEditor";

const imageLinks = [
    "901c0a0e-e5de-4d7a-8ac3-de11a4632542",
    "6d5506b2-7361-4c58-8f1b-dfe1e196885a",
    "467f7ad0-e397-45fe-be22-a6e8e8afe9fa",
    "897b3ec3-63f8-42c0-83b3-a3a9a1b90b7c",
    "55965522-e075-4ef3-8afc-195dacbf267b", // first
    "bcd5dc1e-a97f-4f76-aa93-511c997ff2f0",
    "7490cf45-09a0-427d-abb7-568d98edf344",
    "59cf9a4a-6a4d-4297-915d-513847681f29",
];

export default function Wishlist(props) {
    const { global_currency, auth, wish_categories, all_user_categories } = usePage().props;
    const { currency, item, text, editpop, openPop, setuped, customtext } =
        props;
    const defaultCurrency =
        (auth && auth.user && auth.user.default_currency) || "GBP";
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const inputRef = useRef(null);
    const [defaultKey, setDefaultKey] = useState(
        item && item.subscription !== null ? +item.subscription : null,
    );

    const [close, setClose] = useState();
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const [repeat, setRepeat] = useState(true);
    const [thumbnail, setThumbnail] = useState(item?.thumbnail || "");
    const [adding, setAdding] = useState(false);
    const [rewardImage, setRewardImage] = useState("");
    const [isAiImage, setIsAiImage] = useState();

    useEffect(() => {
        setClose(openPop);
    }, [openPop]);

    const uploaderRef = useRef();
    const uploaderRef1 = useRef();
    const resetUploader = () => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
        if (uploaderRef1.current) {
            uploaderRef1.current.reset();
        }
        if (contentUploaderRef.current) {
            contentUploaderRef.current.reset();
        }
    };

    const [categories, setcategories] = useState(all_user_categories || wish_categories || []);
    
    useEffect(() => {
        if (all_user_categories && all_user_categories.length > 0) {
            setcategories(all_user_categories);
        } else if (wish_categories && wish_categories.length > 0) {
            setcategories(wish_categories);
        }
    }, [all_user_categories, wish_categories]);
    const fetch_categories = async () => {
        const controller = new AbortController();
        const { signal } = controller;
        axios
            .get(`/user/category/${auth && auth.user && auth.user.username}`, {
                signal,
            })
            .then((resp) => {
                setcategories(resp.data.categories);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const AddCategory = async () => {
        
        const value = inputRef.current.value;
        setAdding(true);
        axios
            .post("/user/save-category", { category: value })
            .then((res) => {
                setAdding(false);
                if (res.data.status) {
                    successAlert(res.data.msg || "Added");
                    inputRef.current.value = "";
                    fetch_categories();
                } else {
                    errorAlert(res.data.msg || "Something went wrong.");
                }
            })
            .catch((err) => {
                setAdding(false);
                errorsHandling(err);
            });
    };

    const { data, setData, post, transform, processing, errors, reset } = useForm({
        // One reward object in form state, flattened to the server's columns on
        // submit — see the transform() below.
        reward: item ? rewardFromItem(item) : emptyReward(),
        wishname: item && item.wishname ? item.wishname : "",
        goal_label: item && item.goal_label ? item.goal_label : "",
        price: item && item.price ? item.price : "",
        item_url: item && item.item_url ? item.item_url : "",
        thumbnail:
            item && item.thumbnail
                ? item.thumbnail
                : editpop
                  ? ""
                  : imageLinks[0],
        reward_file: item && item.reward_file ? item.reward_file : "",
        content_file: item?.content_file || "",
        content_file_name: item?.content_file_name || "",
        content_file_type: item?.content_file_type || "",
        content_file_size: item?.content_file_size || 0,
        subscription: item && item.subscription ? item.subscription : 0,
        subscription_period:
            item && item.subscription_period ? item.subscription_period : "",
        repeat_purchase:
            item && item.repeat_purchase ? item.repeat_purchase : 1,
        category: item && item.category ? item.category : 0,
        ai_generated: isAiImage ? 1 : 0,
    });

    transform((payload) => {
        const { reward, ...rest } = payload;
        return { ...rest, ...rewardToPayload(reward) };
    });

    const [step, setStep] = useState(1);
    const totalSteps = 3;

    const nextStep = () => {
        if (step < totalSteps) {
            // Validation for Step 1
            if (step === 1) {
                if (!data.wishname) {
                    errorAlert("Please enter a wish name.");
                    return;
                }
                if (!data.price) {
                    errorAlert("Please enter a price.");
                    return;
                }
                if (!data.category && !editpop && checkboxes.length === 0) {
                    errorAlert("Please choose a category.");
                    return;
                }
            }
            // Validation for Step 2
            if (step === 2) {
                // Thumbnail is optional, defaults to first image if not provided
            }

            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const renderProgressBar = () => {
        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div
                    className="bg-pink-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
            </div>
        );
    };

    const onSlideChange = (swiper) => {
        setData("thumbnail", imageLinks[swiper && swiper.activeIndex]);
    };

    const setSubs = (e) => {
        setData("subscription", e);
        setRepeat(true);
    };

    const [checkboxes, setCheckboxes] = useState([]);
    const [real_category, setreal_category] = useState(
        item && item.real_category,
    );
    const catValue = (event) => {
        const { value, checked } = event.target;
        if (checked) {
            setCheckboxes([...checkboxes, value]);
        } else {
            setreal_category(checkboxes.filter((item) => item !== value));
            setCheckboxes(checkboxes.filter((item) => item !== value));
        }
    };

    const [contentFile, setContentFile] = useState(item?.content_file || "");
    const [contentFileMetadata, setContentFileMetadata] = useState({
        name: item?.content_file_name || "",
        type: item?.content_file_type || "",
        size: item?.content_file_size || 0,
    });
    const contentUploaderRef = useRef();

    const getContentFileUID = async (uploadData) => {
        let uuid = uploadData?.uuid;
        setContentFile(uuid);

        // Store complete file metadata
        const metadata = {
            name: uploadData?.name || "Content file",
            type: uploadData?.mimeType
                ? `${uploadData.mimeType}/${uploadData.mimeSubtype}`
                : "file",
            size: uploadData?.size || 0,
            isImage: uploadData?.isImage || false,
            isVideo: uploadData?.isVideo || false,
            isAudio: uploadData?.isAudio || false,
        };
        setContentFileMetadata(metadata);

        // Update only the content file fields, preserving existing form data
        setData((prevData) => ({
            ...prevData,
            content_file: uuid,
            content_file_name: metadata.name,
            content_file_type: metadata.type,
            content_file_size: metadata.size,
        }));
    };

    // Content file updates are handled in getContentFileUID function

    const [isEditable, setIsEditable] = useState(false);
    const getFileUID = async (data) => {
        // Only handle thumbnail uploads - ensure this is specifically for thumbnail
        if (data?.uuid) {
            let thumbnailUuid = data.uuid;
            setThumbnail(thumbnailUuid);
            // setIsEditable(true);
        }
    };

    // const wishImageEdited = async (d, uuid) => {
    //     const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`;
    //     setThumbnail(url);
    //     setIsEditable(false);
    // };

    const getAIImage = (e) => {
        setRewardImage(
            e.uuid +
                "/-/text_align/left/center/-/font/10/fff/-/text/80px8p/8p,100p/Made%20with%20AI%20/-/format/jpeg/-/preview/",
        );
        setIsAiImage(e.url);
        setData("ai_generated", 1);
    };

    const getrewardFile = async (data) => {
        let ss = data?.uuid;
        setRewardImage(ss);
        setIsAiImage(false);
        setData("ai_generated", 0);
    };

    const rpValue = (e) => {
        setRepeat(e.target.checked);
        setData("repeat_purchase", e.target.checked ? 1 : 0);
    };

    const spValue = (e) => {
        setData("subscription_period", e.target.value);
    };

    useEffect(() => {
        setData("category", checkboxes);
    }, [checkboxes]);

    useEffect(() => {
        if (thumbnail) {
            setData("thumbnail", thumbnail);
        } else {
            // Default to first image if thumbnail is cleared (and not editing an existing item with no thumbnail)
            setData("thumbnail", imageLinks[0]);
        }
    }, [thumbnail]);

    // Initialize thumbnail state when editing an item
    useEffect(() => {
        if (editpop && item?.thumbnail) {
            setThumbnail(item.thumbnail);
        }
    }, [editpop, item]);

    // Initialize contentFile state when editing an item
    useEffect(() => {
        if (editpop && item?.content_file) {
            setContentFile(item.content_file);
        }
    }, [editpop, item]);

    const createWishList = async (e) => {
        e.preventDefault();
        if (currency == null || undefined) {
            errorAlert("Please choose a default currency.");
            return false;
        }
        if (!setuped) {
            errorAlert("You need to connect your stripe account first.");
            return false;
        }
        if (data && !data.category && !editpop) {
            errorAlert("Please choose a category for this item.");
            return false;
        }
        const rewardProblem = validateReward(data.reward);
        if (rewardProblem) {
            errorAlert(rewardProblem);
            return false;
        }
        if (editpop) {
            post(route(`update_wish_item`, [item && item.uuid]), {
                preserveScroll: true,
                onSuccess: (resp) => {
                    if (resp.props.flash?.success !== null) {
                        router.visit(
                            route("user.show", {
                                username: auth?.user?.username,
                                page: "wishes",
                            }),
                        );
                        reset();
                        setClose(false);
                        window.dispatchEvent(new Event("closeAddOptions"));
                        setTimeout(() => {
                            setClose();
                        }, 100);
                        resetUploader();
                    }
                    if (resp.props.flash?.error) {
                        errorAlert(
                            resp.props.flash?.error || "Something went wrong.",
                        );
                    }
                },
                onError: (_err) => {
                    // `resp` does not exist in this closure — referencing it
                    // threw a ReferenceError and swallowed the real validation
                    // error. errorsHandling surfaces the actual field errors.
                    errorsHandling(_err);
                },
            });
        } else {
            post(route("save_wish_item"), {
                preserveScroll: true,
                onSuccess: (resp) => {
                    if (resp.props.flash?.success !== null) {
                        router.visit(
                            route("user.show", {
                                username: auth?.user?.username,
                                page: "wishes",
                            }),
                        );
                        reset();
                        setClose(false);
                        window.dispatchEvent(new Event("closeAddOptions"));
                        resetUploader();
                        setTimeout(() => {
                            setClose();
                        }, 100);
                    }
                    if (resp.props.flash?.error) {
                        errorAlert(
                            resp.props.flash?.error || "Something went wrong.",
                        );
                    }
                },
                onError: (_err) => {
                    console.error(_err);
                    errorsHandling(_err);
                    // errorAlert(resp.props.flash?.success || "Added");
                },
            });
        }
    };

    const AddItem = () => {
        return (
            <div className=" flex items-center p-3 rounded-[30px]  border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="p-1 !rounded-[30px]  bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                    <FaRegHeart color="var(--pink)" size="1.5rem" />
                </div>
                <div className="ps-3 text-start">
                    <h2 className="text-md font-normal font-GillSans uppercase">
                        {text ? text : "Add Wish Item"}
                    </h2>
                    <p className="text-sm font-poppins">
                        Fans fund a specific item and unlock an exclusive file.
                    </p>
                </div>
            </div>
        );
    };

    return (
        <Popup
            modalclass="pinkmodal full"
            action={close}
            space="4"
            size="lg"
            classes={`${editpop ? "editpop" : "w-full font-bold addop bg-white rounded-[30px] mb-4 text-center"}`}
            text={customtext || <AddItem />}
        >
            <div className="editprofileModal  wishlistModal  ">
                <div className="editprofileModalInner ">
                    <div className="wishinfo !p-0 lg:!p-4  ">
                        <h2 className="mb-4 !text-start font-GillSans uppercase text-large  mb-1 pr-5">
                            {editpop ? " Edit Wish" : "Add A Wish"}
                        </h2>

                        <form onSubmit={createWishList} className="text-left">
                            {/* Step 1: Basic Info & Category */}
                            <div className={step === 1 ? "block" : "hidden"}>
                                    {item && item.is_suspended == 1 && (
                                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="text-sm font-medium text-red-800">Item Suspended</h3>
                                                    {item.suspend_reason && (
                                                        <div className="mt-2 text-sm text-red-700">
                                                            <p>{item.suspend_reason}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                <p className="p-4 mb-4 text-normal text-yellow-800 rounded-[20px]   border border-yellow-500 bg-yellow-50">
                                    Describe the content the supporter receives
                                    (e.g. "Exclusive photo set"). Do not list
                                    personal items, gifts, expenses, or
                                    brand/third-party service names — these will
                                    be rejected and removed. Our AI blocks adult
                                    content but any overly suggestive images
                                    will also be rejected. Please reach out to
                                    support for further clarification.
                                </p>

                                <div className="mb-4">
                                    <label className="mb-2 text-left block font-semibold text-gray-700">
                                        Goal{" "}
                                        <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        id="goal_label"
                                        name="goal_label"
                                        type="text"
                                        maxLength={60}
                                        placeholder="Eg. New camera fund"
                                        value={data.goal_label}
                                        className="w-full border-gray-300 focus:border-[#FF007F] focus:ring-pink-500 rounded-[30px]  shadow-sm px-4 py-3"
                                        onChange={(e) =>
                                            setData("goal_label", e.target.value)
                                        }
                                    />
                                    <p className="mt-1 text-xs text-gray-500 text-left">
                                        A goal you're working toward (e.g. "studio
                                        upgrade"). Shown as context only — it's never
                                        what the supporter buys. Don't name a bill, debt
                                        or expense (e.g. rent, phone bill).
                                    </p>
                                    {errors.goal_label && (
                                        <p className="mt-1 text-xs text-red-500 text-left">
                                            {errors.goal_label}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="mb-2 text-left block font-semibold text-gray-700">
                                        Content Title
                                    </label>
                                    <input
                                        id="wishname"
                                        name="wishname"
                                        type="text"
                                        placeholder="Eg. Exclusive photo set"
                                        value={data.wishname}
                                        className="w-full border-gray-300 focus:border-[#FF007F] focus:ring-pink-500 rounded-[30px]  shadow-sm px-4 py-3"
                                        autoComplete="name"
                                        onChange={(e) =>
                                            setData("wishname", e.target.value)
                                        }
                                        required
                                    />
                                    {errors.wishname && (
                                        <p className="mt-1 text-xs text-red-500 text-left">
                                            {errors.wishname}
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="mb-2 text-left block font-semibold text-gray-700">
                                        Price ({defaultCurrency})
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold text-gray-500">
                                            {defaultCurrency}
                                        </span>
                                        <input
                                            id="price"
                                            type="number"
                                            name="price"
                                            placeholder="Eg. 50"
                                            value={data.price}
                                            step="0.01"
                                            className="w-full border-gray-300 focus:border-[#FF007F] focus:ring-pink-500 rounded-[30px]  shadow-sm pl-16 pr-4 py-3"
                                            autoComplete="price"
                                            onChange={(e) =>
                                                setData("price", e.target.value)
                                            }
                                        />
                                    </div>
                                    {data.price > 0 && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-[30px]  border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-gray-600">Fans pay:</span>
                                                <span className="font-bold text-gray-900">
                                                    {new Intl.NumberFormat('en-GB', { 
                                                        style: 'currency', 
                                                        currency: defaultCurrency 
                                                    }).format(calculateTotalSupporterPays(data.price, defaultCurrency).total_supporter_pays)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">You receive:</span>
                                                <span className="font-bold text-green-600">
                                                    {new Intl.NumberFormat('en-GB', { 
                                                        style: 'currency', 
                                                        currency: defaultCurrency 
                                                    }).format(data.price)}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500 font-medium">Fans only see the total price to improve conversion</p>
                                            <p className="mt-1 text-xs text-gray-500 font-medium">Our fee is 19%. Uplift will show higher due to stripe / conversions to ensure you always receive 100% or slightly more.</p>
                                        </div>
                                    )}
                                    {defaultCurrency !== global_currency &&
                                        data.price > 0 && (
                                            <p className="mt-2 text-sm text-gray-500">
                                                ≈{" "}
                                                {formatMultiPrice(
                                                    data.price,
                                                    defaultCurrency,
                                                )}{" "}
                                                ({global_currency})
                                            </p>
                                        )}
                                </div>

                                <div className="mb-4">
                                    <label className="mb-2 text-left block font-semibold text-gray-700">
                                        Category
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar ">
                                        {categories && categories.length ? (
                                            categories.map((c, i) => {
                                                const filteritem =
                                                    real_category &&
                                                    real_category.filter(
                                                        (item) =>
                                                            item?.category ==
                                                            c?.category,
                                                    );
                                                const isCategory =
                                                    filteritem && filteritem[0]
                                                        ? true
                                                        : null;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="relative"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            id={
                                                                "categories" + i
                                                            }
                                                            value={c.id}
                                                            name="category"
                                                            onChange={catValue}
                                                            checked={isCategory}
                                                            className="peer hidden"
                                                        />
                                                        <label
                                                            htmlFor={
                                                                "categories" + i
                                                            }
                                                            className="block cursor-pointer select-none rounded-[15px] border border-gray-300 px-4 py-2 text-sm font-medium transition-colors peer-checked:bg-[#FF007F] peer-checked:text-white peer-checked:border-[#FF007F] hover:bg-gray-50"
                                                        >
                                                            {c.category}
                                                        </label>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-gray-500 text-sm">
                                                No categories found.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            id="cats"
                                            type="text"
                                            ref={inputRef}
                                            placeholder="New Category"
                                            className="flex-1 border-gray-300 focus:border-[#FF007F] focus:ring-pink-500 !rounded-[10px] shadow-sm p-3 text-sm"
                                        />
                                        <button
                                            type="button"
                                            className="bg-gray-900 text-white p-3 px-6 !rounded-[10px] text-sm font-medium hover:bg-gray-800 transition-colors"
                                            onClick={AddCategory}
                                        >
                                            {adding ? "Adding..." : "Add"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Visuals */}
                            <div className={step === 2 ? "block" : "hidden"}>
                                <div className="mb-6">
                                    <label className="mb-4 text-left block font-semibold text-gray-700">
                                        Choose Image or Upload
                                    </label>

                                    {thumbnail ? (
                                        <div className="relative mb-4 group">
                                            <img
                                                className="w-full h-64 object-cover rounded-[30px]  border border-gray-200 shadow-sm"
                                                src={`https://ucarecdn.com/${thumbnail}/`}
                                                alt="Wish Thumbnail"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-4 right-4 bg-white/90 text-red-600 p-2 rounded-full shadow-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                onClick={() => setThumbnail("")}
                                            >
                                                <RiCloseLine size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="bg-gray-50 p-4 rounded-[30px] ">
                                                <h4 className="text-sm font-medium text-gray-500 mb-3 text-center">
                                                    Select from Default
                                                </h4>
                                                <Swiper
                                                    spaceBetween={10}
                                                    pagination={{
                                                        clickable: true,
                                                    }}
                                                    navigation={true}
                                                    onSlideChange={
                                                        onSlideChange
                                                    }
                                                    modules={[
                                                        Pagination,
                                                        Navigation,
                                                    ]}
                                                    slidesPerView={1}
                                                    className="rounded-[20px] overflow-hidden"
                                                >
                                                    {imageLinks &&
                                                        imageLinks.map(
                                                            (image) => (
                                                                <SwiperSlide
                                                                    key={`swiper-item-${image}`}
                                                                    className="rounded-[20px] overflow-hidden"
                                                                >
                                                                    <div className="aspect-w-16 aspect-h-9">
                                                                        <img
                                                                            src={`https://ucarecdn.com/${image}/`}
                                                                            className="w-full h-52 object-cover rounded-[20px]"
                                                                            alt="Default"
                                                                        />
                                                                    </div>
                                                                </SwiperSlide>
                                                            ),
                                                        )}
                                                </Swiper>
                                            </div>

                                            <div className="relative">
                                                <div
                                                    className="absolute inset-0 flex items-center"
                                                    aria-hidden="true"
                                                >
                                                    <div className="w-full border-t border-gray-300"></div>
                                                </div>
                                                <div className="relative flex justify-center">
                                                    <span className="bg-white px-2 text-sm text-gray-500">
                                                        OR UPLOAD NEW
                                                    </span>
                                                </div>
                                            </div>

                                            <div
                                                className={`${!isEditable ? "" : "hidden"} editable`}
                                            >
                                                <GlobalUploader
                                                    type="minimal"
                                                    ctxName="wish-thumbnail"
                                                    ref={uploaderRef}
                                                    accept="image/*"
                                                    sendFile={getFileUID}
                                                    options={
                                                        st.wishitemUploader
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: Fulfillment & Settings */}
                            <div className={step === 3 ? "block" : "hidden"}>
                                <div className="mb-8">
                                    <RewardEditor
                                        value={data.reward}
                                        onChange={(next) => setData("reward", next)}
                                        ctxName="wishlistcontent"
                                        errors={errors}
                                    />
                                </div>

                                <div className="hidden mb-6 border-t border-gray-100 pt-6">
                                    <label className="mb-4 text-left block font-semibold text-gray-700">
                                        Wish Type
                                    </label>
                                    <div className="md:flex gap-4 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setSubs(0)}
                                            className={`w-full mb-2 flex-1 py-3 px-4 rounded-[30px]  border font-medium transition-all ${
                                                data.subscription === 0
                                                    ? "border-[#FF007F] bg-pink-50 text-pink-700 shadow-sm"
                                                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            One-Time Purchase
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSubs(1)}
                                            className={`w-full mb-2 flex-1 py-3 px-4 rounded-[30px]  border font-medium transition-all ${
                                                data.subscription === 1
                                                    ? "border-[#FF007F] bg-pink-50 text-pink-700 shadow-sm"
                                                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                            }`}
                                        >
                                            Subscription
                                        </button>
                                    </div>

                                    {data.subscription === 0 ? (
                                        <div className="bg-gray-50 p-4 rounded-[20px]">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={repeat}
                                                    onChange={rpValue}
                                                    className="w-5 h-5 text-[#FF007F] rounded border-gray-300 focus:ring-pink-500"
                                                />
                                                <span className="text-gray-700 font-medium">
                                                    Allow Repeat Purchases
                                                </span>
                                            </label>
                                            <p className="text-xs text-gray-500 mt-2 ml-8">
                                                If checked, fans can buy this
                                                item multiple times.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 p-6 rounded-[20px]">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Billing Period
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                {[
                                                    "daily",
                                                    "weekly",
                                                    "monthly",
                                                ].map((period) => (
                                                    <label
                                                        key={period}
                                                        className="cursor-pointer"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="subscription_period"
                                                            value={period}
                                                            checked={
                                                                data.subscription_period ===
                                                                period
                                                            }
                                                            onChange={spValue}
                                                            className="peer hidden"
                                                        />
                                                        <div className="px-4 py-2 rounded-[30px]  border border-gray-200 bg-white text-gray-600 text-sm font-medium peer-checked:border-[#FF007F] peer-checked:bg-pink-50 peer-checked:text-pink-700 transition-all hover:bg-gray-50 uppercase">
                                                            {period}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {renderProgressBar()}

                            {/* Navigation Buttons */}
                            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-gulfs uppercase text-sm md:text-normal tracking-wider rounded-[30px]  hover:bg-gray-200 transition-colors"
                                    >
                                        Back
                                    </button>
                                )}

                                {step < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex-1 py-3 px-4 bg-[#FF007F] text-white font-gulfs uppercase text-sm md:text-normal tracking-wider rounded-[30px]  hover:bg-pink-600 transition-colors shadow-md shadow-pink-200"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <LoaderButton
                                        disabled={processing}
                                        type="submit"
                                        className="!mt-0 flex-1 py-3 !border-0 px-4 !bg-[#FF007F] text-white font-gulfs uppercase text-sm md:text-normal tracking-wider rounded-[30px]  hover:bg-pink-600 transition-colors shadow-md shadow-pink-200"
                                        spinnerclass="fill-white"
                                    >
                                        {processing
                                            ? editpop
                                                ? "Updating..."
                                                : "Processing..."
                                            : editpop
                                              ? "Update Wish"
                                              : "Add Wish"}
                                    </LoaderButton>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Popup>
    );
}
