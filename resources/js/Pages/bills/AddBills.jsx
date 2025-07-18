import st from "../../../css/uploader.module.css";
// import data  from "../../../css/uploader.module.css"
import { router, useForm, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import React, { useEffect } from "react";
import LoaderButton from "@/Components/LoaderButton";
// const Popup = React.lazy(() => import("@/Components/Popup"));
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
    const [thumbnail, setThumbnail] = useState("");
    const [close, setClose] = useState();
    const { updatebill, item, isEdit, editpop, text, classes, fetchBills } = props;
    const { formatMultiPrice } = PriceFormat();
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
    const createBills = async (e) => {
        e.preventDefault();
        setLoading(true);
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
                    setTimeout(() => {
                        setClose();
                    }, 100);
                    reset();
                    resetUploader();
                } else {
                    errorAlert(resp.data.msg);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("err", err);
                setLoading(false);
                errorsHandling(err);
            });
    };

    const AddItem = () => {
        return (
            <div className=" flex items-center">
                <div className="p-1 rounded-lg bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                    <SlCalender color="var(--pink)" size="1.5rem" />
                </div>
                <div className="ps-3 text-start">
                    <h2 className="text-md font-normal font-GillSans uppercase">Add Bills</h2>
                    <p className="text-sm font-poppins">
                        Get those pesky bills paid with exclusive content
                    </p>
                </div>
            </div>
        );
    };

    const defaultCurrency = (auth && auth.user && auth.user.default_currency) || "USD";
    return (
        <Popup
            modalclassName="pinkmodal full"
            size="md"
            action={close}
            classes={classes ? classes : `  ${editpop? "editpop": "addop w-full font-bold  bg-white rounded-xl p-3 mb-2 text-center"}`}
            text={text ? text : <AddItem />} >
            <div className="editprofileModal  wishlistModal ">
                <div className="editprofileModalInner">
                    <h2 className="p-4 !pb-0 text-black text-start !border-0 font-GillSans uppercase text-large mb-1 pe-5">
                        {isEdit ? "Update Bill" : "Add A Bill"}
                    </h2>
                    <div className="wishinfo  p-4  ">
                        <form onSubmit={createBills}>
                            <ul className="ps-0">
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">
                                        {" "}
                                        Bill Name{" "}
                                    </label>
                                    <input
                                        id="wishname"
                                        name="name"
                                        type="text"
                                        placeholder="Eg. Netflix subscription"
                                        value={data.name}
                                        className="form-input px-2 py-2 border w-full rounded-md"
                                        autoComplete="name"
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        required
                                    />
                                </li>
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">
                                        Price{" "}
                                    </label>
                                    <div className="currency-wrapper dollar position-relative">
                                        <span className="currency-tag ">$
                                            {/* {defaultCurrency} */}
                                        </span>
                                        <input
                                            id="price"
                                            type="number"
                                            name="price"
                                            placeholder="Eg. 50"
                                            defaultValue={
                                                (item && item.price) ||
                                                data.price
                                            }
                                            className="form-input px-2 py-2 border w-full rounded-md"
                                            autoComplete="price"
                                            onChange={(e) =>
                                                setData("price", e.target.value)
                                            }
                                        />
                                    </div>
                                    {defaultCurrency !== 'USD' &&
                                    <p className="mt-1">
                                        The Bill amount is set to{" "}
                                        {formatMultiPrice(
                                            data.price,
                                            defaultCurrency
                                        )}.
                                    </p> }
                                </li>

                                <li className="mb-4">
                                    <div className="singlewishbox rounded ">
                                        <strong className="mb-2 text-start d-block ">
                                            {" "}
                                            Allows gifter to purchase this item
                                            on a recurring basis.{" "}
                                        </strong>
                                        <div className="repeatpurchase mt-2 text-start">
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
                                        <div className="repeatpurchase mt-2 text-start">
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
                                        <div className="repeatpurchase text-start">
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
                                    <label className="mb-2 text-start d-block">
                                        Choose Image or Upload
                                    </label>

                                    {item && item.perma_link ? (
                                        <div className="default-wish-img mb-1">
                                            <img
                                                src={
                                                    (item && item.perma_link) ||
                                                    uploadedimg
                                                }
                                                className="img-fluid"
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
                                                                    className="img-fluid"
                                                                />
                                                            </div>
                                                        </SwiperSlide>
                                                    );
                                                })}
                                        </Swiper>
                                    )}

                                    <h4 className="mt-2 mb-2 w-100 text-center">
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

                            <p className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
                                When adding items please ensure they are specific
                                i.e Holiday Clothes or New Gym Equipment. Items that
                                are non specific will be rejected and removed. Our
                                AI blocks adult content but any overly suggestive
                                images will also be rejected. Please reach out to
                                support for further clarification.
                            </p>

                            <div className="publish text-start">
                                {isEdit ? (
                                    <LoaderButton
                                        disabled={loading}
                                        type="submit"
                                        className="flex w-100 btn-pink lg mx-auto"
                                        spinnerClassName="fill-red-600"
                                    >
                                        {loading ? "Updating.." : "Update Bill"}
                                    </LoaderButton>
                                ) : (
                                    <>
                                        <LoaderButton
                                            disabled={loading}
                                            type="submit"
                                            className="flex w-100 btn-pink lg mx-auto"
                                            spinnerClassName="fill-red-600"
                                        >
                                            {loading
                                                ? "Processing"
                                                : "Add Bills"}
                                        </LoaderButton>
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
