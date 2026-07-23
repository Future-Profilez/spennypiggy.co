import st from "../../../css/uploader.module.css";
// import data  from "../../../css/uploader.module.css"
import { router, useForm, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import { useEffect, lazy } from "react";
import LoaderButton from "@/Components/LoaderButton";
// const Popup = lazy(() => import("@/Components/Popup"));
import { useState } from "react";
import GlobalUploader from "@/uploadcare/Uploader";
import Popup from "@/Components/Popup";
import { Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { useRef } from "react";
import PriceFormat from "@/includes/PriceFormat";
import axios from "axios";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import { SlCalender } from "react-icons/sl";

export default function AddBills(props) {
    const { successAlert, errorAlert, infoAlert, errorsHandling } = useAlerts();
    const { global_currency, auth } = usePage().props;
    const subscriberOnlyPostsCount = auth?.subscriber_only_posts_count || 0;
    const [thumbnail, setThumbnail] = useState("");
    const [close, setClose] = useState();
    const { updatebill, item, isEdit, editpop, text, classes, fetchBills } = props;
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const BillsImages = [
        "901c0a0e-e5de-4d7a-8ac3-de11a4632542",
        "6d5506b2-7361-4c58-8f1b-dfe1e196885a",
        "467f7ad0-e397-45fe-be22-a6e8e8afe9fa",
        "897b3ec3-63f8-42c0-83b3-a3a9a1b90b7c",
        "55965522-e075-4ef3-8afc-195dacbf267b", // first
        "bcd5dc1e-a97f-4f76-aa93-511c997ff2f0",
        "7490cf45-09a0-427d-abb7-568d98edf344",
        "59cf9a4a-6a4d-4297-915d-513847681f29",
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: item && item.name ? item.name : "",
        goal_label: item && item.goal_label ? item.goal_label : "",
        price: item && item.price ? item.price : "",
        thumbnail: item && item.thumbnail ? item.thumbnail : BillsImages[0],
        period: item && item.period ? item.period : "weekly",
    });

    const uploaderRef = useRef();
    const resetUploader = () => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
    };

    const [period, setPeriod] = useState(
        item && item.period ? item.period : "weekly"
    );
    const spValue = (e) => {
        setPeriod(e.target.value);
        setData("period", e.target.value);
    };

    const onSlideChange = (swiper) => {
        setData("thumbnail", BillsImages[swiper && swiper.activeIndex]);
    };

    const [isEditable, setIsEditable] = useState(false);
    const getFileUID = async (data) => {
        let ss = data?.uuid;
        setThumbnail(ss);
        setIsEditable(true);
    };

    const wishImageEdited = async (d, uuid) => {
        const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`;
        setThumbnail(url);
        setIsEditable(false);
    };

    useEffect(() => {
        setData("thumbnail", thumbnail);
    }, [thumbnail]);

    const [loading, setLoading] = useState(false);
    // The form posts via axios, not useForm.post, so Inertia's `errors` never fills.
    // Keep server-side field errors locally so they can render inline.
    const [fieldErrors, setFieldErrors] = useState({});
    const createBills = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setFieldErrors({});
        axios
            .post(isEdit ? `/bill/edit/${item.uuid}` : `/bill/save`, data)
            .then((resp) => {
                fetchBills && fetchBills();
                if (resp.data.status) {
                    router.visit(
                        route("user.show", {
                            username: auth.user.username,
                            page: "bills",
                        }),
                        {
                            preserveState: true,
                            preserveScroll: true,
                        }
                    );
                    successAlert(resp.data.msg);
                    setClose(false);
                    window.dispatchEvent(new Event("closeAddOptions"));
                    setTimeout(() => {
                        setClose();
                    }, 100);
                    reset();
                    resetUploader();
                } else {
                    setFieldErrors(resp.data.errors || {});
                    errorAlert(resp.data.msg);
                }
                setLoading(false);
            })
            .catch((err) => {
                setFieldErrors(err?.response?.data?.errors || {});
                setLoading(false);
                errorsHandling(err);
            });
    };

    const AddItem = () => {
        return (
            <div className=" flex items-center">
                <div className="p-1 rounded-box-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px]">
                    <SlCalender color="var(--pink)" size="1.5rem" />
                </div>
                <div className="pl-3 text-left">
                    <h2 className="text-sm md:text-lg font-normal font-GillSans uppercase leading-tight">Recurring content</h2>
                    <p className="text-sm font-poppins">
                        Sell content your supporters unlock every week or month.
                    </p>
                </div>
            </div>
        );
    };

    const defaultCurrency = (auth && auth.user && auth.user.default_currency) || "USD";
    const fieldError = (field) => {
        const err = fieldErrors[field] || errors[field];
        return Array.isArray(err) ? err[0] : err;
    };
    return (
        <Popup
            modalclass="pinkmodal full"
            size="md"
            action={close}
            classes={classes ? classes : `  ${editpop? "editpop": "addop w-full font-bold  bg-white rounded-box   p-3 mb-2 text-center"}`}
            text={text ? text : <AddItem />} >
            <div className="editprofileModal  wishlistModal ">
                <div className="editprofileModalInner">
                    <h2 className="p-4 !pb-0 text-black text-left !border-0 font-GillSans uppercase text-large mb-1 pr-5">
                        {isEdit ? "Manage subscription" : "Add recurring content"}
                    </h2>
                    <div className="wishinfo  p-4  ">
                        {item && item.is_suspended == 1 && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-box-sm">
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
                        <form onSubmit={createBills}>
                            <ul className="pl-0">
                                <li className="mb-4">
                                    <label className="mb-2 text-left block">
                                        Goal{" "}
                                        <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <input
                                        id="goal_label"
                                        name="goal_label"
                                        type="text"
                                        maxLength={60}
                                        placeholder="Eg. Studio upgrade"
                                        value={data.goal_label}
                                        className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-box-sm  "
                                        onChange={(e) =>
                                            setData("goal_label", e.target.value)
                                        }
                                    />
                                    <p className="mt-1 text-xs text-gray-500 text-left">
                                        A goal you're working toward — shown as context
                                        only, never what the supporter buys. Don't name a
                                        bill, debt or expense (e.g. rent, phone bill).
                                    </p>
                                    {fieldError("goal_label") && (
                                        <p className="mt-1 text-xs text-red-500 text-left">
                                            {fieldError("goal_label")}
                                        </p>
                                    )}
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-left block">
                                        {" "}
                                        Subscription / content name{" "}
                                    </label>
                                    <input
                                        id="wishname"
                                        name="name"
                                        type="text"
                                        placeholder="Eg. Weekly behind-the-scenes"
                                        value={data.name}
                                        className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-box-sm  "
                                        autoComplete="name"
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        required
                                    />
                                    {fieldError("name") && (
                                        <p className="mt-1 text-xs text-red-500 text-left">
                                            {fieldError("name")}
                                        </p>
                                    )}
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-left block">
                                        Price ({defaultCurrency})
                                    </label>
                                    <div className="currency-wrapper dollar-symbols relative">
                                        <span className="currency-tag "> 
                                            {defaultCurrency}
                                        </span>
                                        <input
                                            id="price"
                                            type="number"
                                            name="price"
                                            placeholder="Eg. 50"
                                            value={data.price}
                                            min="4.99"
                                            max="100"
                                            step="0.01"
                                            className="border-gray-300 border px-4 py-2 pl-8 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-box-sm  "
                                            autoComplete="price"
                                            onChange={(e) =>
                                                setData("price", e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 text-left">
                                        Between {defaultCurrency} 4.99 and {defaultCurrency} 100 per period.
                                    </p>
                                    {fieldError("price") && (
                                        <p className="mt-1 text-xs text-red-500 text-left">
                                            {fieldError("price")}
                                        </p>
                                    )}
                                    {data.price > 0 && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-box  border border-gray-100">
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
                                            <p className="mt-1 text-xs text-gray-500 font-medium">All platform and payment processing fees are included in the fan price, so you always receive 100% of your listed amount (or slightly more).</p>
                                        </div>
                                    )}
                                    {defaultCurrency !== global_currency && data.price > 0 && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        ≈ {formatMultiPrice(
                                            data.price,
                                            defaultCurrency
                                        )} ({global_currency})
                                    </p> 
                                    )}
                                </li>

                                <li className="mb-4">
                                    <div className="singlewishbox rounded ">
                                        <strong className="mb-2 text-left block ">
                                            {" "}
                                            Allows fans to purchase this item
                                            on a recurring basis.{" "}
                                        </strong>
                                        <div className="repeatpurchase mt-2 text-left">
                                            <label
                                                htmlFor="weekly"
                                                className="w-auto"
                                            >
                                                <input
                                                    checked={period == "weekly"}
                                                    type="radio"
                                                    id="weekly"
                                                    value={"weekly"}
                                                    name="subscription_period"
                                                    onChange={spValue}
                                                />{" "}
                                                Weekly
                                            </label>
                                        </div>
                                        <div className="repeatpurchase mt-2 text-left">
                                            <label
                                                htmlFor="monthly"
                                                className="w-auto"
                                            >
                                                <input
                                                    checked={
                                                        period == "monthly"
                                                    }
                                                    type="radio"
                                                    id="monthly"
                                                    value={"monthly"}
                                                    name="subscription_period"
                                                    onChange={spValue}
                                                />{" "}
                                                Monthly
                                            </label>
                                        </div>
                                        <div className="repeatpurchase text-left">
                                            <label
                                                htmlFor="yearly"
                                                className="w-auto"
                                            >
                                                <input
                                                    checked={period == "yearly"}
                                                    type="radio"
                                                    id="yearly"
                                                    value={"yearly"}
                                                    name="subscription_period"
                                                    onChange={spValue}
                                                />{" "}
                                                Yearly
                                            </label>
                                        </div>
                                    </div>
                                </li>

                                <li className="mb-4">
                                    <label className="mb-2 text-left block">
                                        Choose Image or Upload
                                    </label>

                                    {item && item.perma_link ? (
                                        <div className="default-wish-img mb-1">
                                            <img
                                                src={
                                                    (item && item.perma_link) ||
                                                    uploadedimg
                                                }
                                                alt={item?.name || "Bill image"}
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    ) : (
                                        <Swiper
                                            spaceBetween={0}
                                            pagination={{ clickable: true }}
                                            navigation={true}
                                            onSlideChange={onSlideChange}
                                            modules={[Pagination, Navigation]}
                                            slidesPerView={1}
                                        >
                                            {BillsImages &&
                                                BillsImages.map((image) => {
                                                    return (
                                                        <SwiperSlide
                                                            key={`swiper-item-${image}`}
                                                        >
                                                            <div className="default-wish-img mb-1">
                                                                <img
                                                                    src={`https://ucarecdn.com/${image}/`}
                                                                    alt=""
                                                                    className="w-full h-auto"
                                                                />
                                                            </div>
                                                        </SwiperSlide>
                                                    );
                                                })}
                                        </Swiper>
                                    )}

                                    <h4 className="mt-2 mb-2 w-full text-center">
                                        OR
                                    </h4>

                                    <div
                                        className={`${
                                            !isEditable ? "" : "d-none"
                                        } editable`}
                                    >
                                        <GlobalUploader ctxName='add-bills-context'
                                            type="minimal"
                                            ref={uploaderRef}
                                            sendFile={getFileUID}
                                            options={st.wishitemUploader}
                                        />
                                    </div>

                                    <div
                                        className={`${
                                            isEditable ? "" : "d-none"
                                        } editable`}
                                    >
                                        <UploadcareEditor
                                            uuid={thumbnail}
                                            updateFile={wishImageEdited}
                                        />
                                    </div>
                                </li>
                            </ul>

                            <p className="p-3 mb-4 text-sm text-yellow-800 rounded-box-sm    bg-yellow-50" role="alert">
                                Describe the recurring content supporters receive
                                (e.g. "Weekly behind-the-scenes"). Do not list bills,
                                personal expenses, or brand/third-party service names —
                                these will be rejected and removed. Our AI blocks adult
                                content but any overly suggestive images will also be
                                rejected. Please reach out to support for further
                                clarification.
                            </p>

                            <div className="publish text-start mt-6 mb-4">
    {isEdit ? (
        <LoaderButton
            disabled={loading}
            type="submit"
            className="p w-full min-h-[54px]"
            spinnerclass="fill-red-600"
        >
            {loading ? "Updating.." : "Manage subscription"}
        </LoaderButton>
    ) : (
        <>
            <LoaderButton
                disabled={loading || subscriberOnlyPostsCount === 0}
                type="submit"
                className="p w-full min-h-[54px]"
                spinnerclass="fill-red-600"
            >
                {loading ? "Processing" : "Add Recurring Content"}
            </LoaderButton>

            {subscriberOnlyPostsCount === 0 && (
                <div className="pt-3 px-2">
                    <p className="text-center text-red-500 text-sm leading-6">
                        You haven't added any subscriber-only posts yet.
                        <br />
                        Please create at least one before adding a bill.
                    </p>
                </div>
            )}
        </>
    )}
</div>
                        </form>
                    </div>
                </div>
            </div>
        </Popup>
    );
}
