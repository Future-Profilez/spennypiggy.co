import st from "../../../css/uploader.module.css";
// import data  from "../../../css/uploader.module.css"
import { useForm, usePage } from "@inertiajs/react";
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

export default function AddBills(props) {
    const { successAlert, errorAlert, infoAlert, warningAlert } = useAlerts();
    const { global_currency, auth } = usePage().props;
    const inputRef = useRef(null);
    const [thumbnail, setThumbnail] = useState("");
    const [clear, setClear] = useState();
    const [close, setClose] = useState();
    const { updatebill, item, isEdit, editpop, text, classes } = props;
    const { formatMultiPrice } = PriceFormat();
    const BillsImages = [
        "be9060ab-1a76-452f-b805-1c71d9af4fb7",
        "01bbc3bd-7e79-4dc0-817c-2c260da43c20",
        "f0c45dc9-cc56-4955-a406-7527004a1373",
        "4c42426a-1396-49e2-8b46-2381a2ae5d7b",
    ];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: item && item.name ? item.name : "",
        price: item && item.price ? item.price : "",
        thumbnail: item && item.thumbnail ? item.thumbnail : BillsImages[0],
    });

    const onSlideChange = (swiper) => {
        setData("thumbnail", BillsImages[swiper && swiper.activeIndex]);
    };

    const getFileUID = async (data) => {
        let ss = data?.uuid;
        setThumbnail(ss);
    };

    useEffect(() => {
        setData("thumbnail", thumbnail);
    }, [thumbnail]);

    const [loading, setLoading] = useState(false);
    const createBills = async (e) => {
        e.preventDefault();
        setLoading(true);
        axios
            .post(`/bill/save`, data)
            .then((resp) => {
                console.log("resp", resp.data);
                if (resp.data.status) {
                    console.log("triggred", updatebill);
                    if (updatebill) {
                        updatebill("updated");
                    }
                    successAlert(resp.data.msg);
                    setClose(false);
                    setTimeout(() => {
                        setClose();
                    }, 100);
                    reset();
                    setClear(new Date());
                } else {
                    errorAlert(resp.data.msg);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.log("err", err);
                setLoading(false);
            });
    };

    const defaultCurrency =
        (auth && auth.user && auth.user.default_currency) || "GBP";
    return (
        <Popup
            modalclass="pinkmodal full"
            size="md"
            action={close}
            classes={
                classes
                    ? classes
                    : `  ${
                          editpop ? "editpop" : "dropdown-item text-start p-0"
                      }`
            }
            text={`${text ? text : "Add Bills"}`}
        >
            <div className="editprofileModal  wishlistModal ">
                <div className="editprofileModalInner">
                    <h2 className="font-GillSans pt-4 px-3">Add A Bill </h2>
                    <div className="wishinfo">
                        <form onSubmit={createBills}>
                            <ul className="ps-0">
                                <li className="mb-4">
                                    <label className="mb-2 text-start d-block">
                                        Bill Name
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
                                    <div className="currency-wrapper position-relative">
                                        <span className="currency-tag">
                                            {defaultCurrency}
                                        </span>
                                        <input
                                            id="price"
                                            type="number"
                                            name="price"
                                            placeholder="Eg. 50"
                                            value={
                                                data.price ||
                                                (item && item.price)
                                            }
                                            step={`0.01`}
                                            className="form-input px-2 py-2 border w-full rounded-md"
                                            autoComplete="price"
                                            onChange={(e) =>
                                                setData("price", e.target.value)
                                            }
                                        />
                                    </div>
                                    <p className="mt-1">
                                        The Bill amount is set to{" "}
                                        {formatMultiPrice(
                                            data.price,
                                            defaultCurrency
                                        )}
                                        .
                                    </p>
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
                                    <GlobalUploader
                                        type="minimal"
                                        clear={clear}
                                        sendFile={getFileUID}
                                        options={st.wishitemUploader}
                                    />
                                </li>
                            </ul>
                            <div className="publish text-start">
                                {isEdit ? (
                                    <LoaderButton
                                        disabled={processing}
                                        type="submit"
                                        className="flex w-100 btn-pink lg mx-auto"
                                        spinnerClassName="fill-red-600"
                                    >
                                        {processing
                                            ? "Updating.."
                                            : "Update Bill"}
                                    </LoaderButton>
                                ) : (
                                    <>
                                        <LoaderButton
                                            disabled={processing}
                                            type="submit"
                                            className="flex w-100 btn-pink lg mx-auto"
                                            spinnerClassName="fill-red-600"
                                        >
                                            {processing
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
