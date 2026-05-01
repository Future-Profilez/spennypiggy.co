import { useAlerts } from "@/Components/Alerts";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useMemo } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import st from "../../../css/uploader.module.css";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import GlobalUploader from "@/uploadcare/Uploader";
import Popup from "@/Components/Popup";
import { AiOutlineShop } from "react-icons/ai";
import Select from "react-select";
import CountriesShipping from "./CountriesShipping";
import ImageGenerationWithAI from "@/Components/ImageGenerationWithAI";
import PriceFormat from "@/includes/PriceFormat";

const lists = [
    { value: "Digital Products", label: "Digital Products" },
    { value: "physical", label: "Physical Product" },
    { value: "Custom Digital Artwork 🖼️", label: "Custom Digital Artwork 🖼️" },
    { value: "Custom Photoshoot 📷 ", label: "Custom Photoshoot 📷" },
    { value: "Video Happy Birthday 🎂 ", label: "Video Happy Birthday 🎂" },
    { value: "Custom Drawing ✍️ ", label: "Custom Drawing ✍️" },
    { value: "Nutrition Plan 🥬- pdf", label: "Nutrition Plan 🥬- pdf" },
    {
        value: "Personal Training Plan 💪🏻- pdf",
        label: "Personal Training Plan 💪🏻- pdf",
    },
    { value: "Style Guide 👗- pdf", label: "Style Guide 👗- pdf" },
    { value: "My E-Book 📕- pdf", label: "My E-Book 📕- pdf" },
];

const updatedVarients = (data) => {
    const arr = [];
    data.forEach((v, i) => {
        if (v.name !== "") {
            arr.push({ name: v.name, value: v.value || null });
        }
    });
    return arr;
};

export default function AddItem(props) {
    const { auth, user } = usePage().props;
    const defaultCurrency = (user && user.default_currency) || "GBP";

    const {
        item,
        update,
        title,
        pre_title,
        pre_description,
        pre_price,
        product_type,
        classes,
        isEdit,
    } = props;
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            document.documentElement.classList.add("overflow-hidden");
        } else {
            document.documentElement.classList.remove("overflow-hidden");
        }
    }, [open]);

    const AddForm = () => {
        const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
        const { global_currency } = usePage().props;
        const [categories, setCategories] = useState([]);
        const [fetchingCats, setFetchingCats] = useState(false);
        const real_category = useMemo(
            () => item?.real_category ?? [],
            [item?.real_category],
        );
        const [thumb, setThumb] = useState(null);
        const [thumbEditable, setIsThumbEditable] = useState(false);
        const [rewardfile, setrewardfile] = useState(null);
        const [haveQuestion, setHaveQuestion] = useState(
            item && item.ask_question ? true : false,
        );
        const [question, setQuestion] = useState(
            (item && item.ask_question) || "",
        );
        const [haveSlots, setHaveSlots] = useState(
            item && item.slot_limitation ? true : false,
        );
        const [slots, setSlots] = useState(
            (item && item.slot_limitation) || "",
        );
        const [haveSpPrice, setHaveSpPrice] = useState(
            item && item.special_member_price ? true : false,
        );
        const [spPrice, setSpPrice] = useState(
            (item && item.special_member_price) || "",
        );
        const [haveQty, setHaveQty] = useState(
            item && item.quantity_allow ? true : false,
        );
        const [pagetype, setPageType] = useState(
            (item && item.success_page_type) || false,
        );
        const [parsedContent, setParsedContent] = useState(
            (item && item.success_page_value) || "",
        );
        const [pageUrl, setpageUrl] = useState(
            (item && item.success_page_value) || "",
        );
        const [checkboxes, setCheckboxes] = useState([]);
        const [shopItem, setShopItem] = useState({
            type: product_type || "Digital Products",
            name: pre_title || "",
            description: pre_description || "",
            price: pre_price || "",
        });

        const [wwsShipping, setwwsShipping] = useState(() => {
            if (item && item.shop_shipping_info) {
                const wws = item.shop_shipping_info.find(s => s.country === 'all');
                return wws ? wws.shipping_price : "";
            }
            return "";
        });
        const [domesticShipping, setDomesticShipping] = useState(() => {
            if (item && item.shop_shipping_info) {
                const domestic = item.shop_shipping_info.find(s => s.country !== 'all');
                return domestic ? domestic.shipping_price : "";
            }
            return "";
        });
        const [variants, setVariants] = useState([]);
        const [shipping_info, setShipping_info] = useState(
            (item && item.shipping_information) || "",
        );

        const [physical, setPhysical] = useState(
            shopItem && shopItem.type === "physical" ? true : false,
        );
        const handleLists = (e) => {
            setShopItem({ ...shopItem, type: e.value });
            if (e.value === "physical") {
                setPhysical(e.value);
            } else {
                setPhysical(false);
            }
        };

        useEffect(() => {
            const arr = real_category
                .map((element) => element?.uuid)
                .filter(Boolean);
            setCheckboxes((prev) => {
                if (
                    prev.length === arr.length &&
                    prev.every((v, idx) => v === arr[idx])
                ) {
                    return prev;
                }
                return arr;
            });
        }, [real_category]);

        const [isChecked, setIsChecked] = useState(false);
        const [adding, setAdding] = useState(false);
        const inputRef = useRef(null);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            // const controller = new AbortController();
            // const { signal } = controller;
            fetchAddedCategories();
            // return () => controller.abort();
        }, [props]);

        const fetchAddedCategories = async () => {
            if (fetchingCats) {
                return false;
            }
            setFetchingCats(true);
            await axios
                .get(
                    `/shop/user_shop_category/${auth.user.username || user.username}`,
                )
                .then((res) => {
                    setCategories(res.data.categories);
                    setFetchingCats(false);
                })
                .catch((err) => {
                    setFetchingCats(false);
                });
        };

        const uploaderRef = useRef();
        const resetUploader = () => {
            if (uploaderRef.current) {
                uploaderRef.current.reset();
            }
        };

        async function getFileUID(thumbs) {
            setThumb(thumbs.uuid || "");
            setIsThumbEditable(true);
        }

        const imageEdited = async (d, uuid) => {
            const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`;
            setIsThumbEditable(false);
            setThumb(url);
        };

        async function getRewardFile(file) {
            setrewardfile(file);
            setIsAiImage(false);
        }

        const [IsAiImage, setIsAiImage] = useState(false);
        const getAIImage = (e) => {
            setrewardfile(
                e.uuid +
                    "/-/text_align/left/center/-/font/10/fff/-/text/80px8p/8p,100p/Made%20with%20AI%20/-/format/jpeg/-/preview/",
            );
            setIsAiImage(e.url);
        };

        const handleHaveQuestion = () => {
            setHaveQuestion(!haveQuestion);
            setQuestion("");
        };

        const handleHaveSlots = () => {
            setHaveSlots(!haveSlots);
            setSlots();
        };

        const handleSpPrice = () => {
            setHaveSpPrice(!haveSpPrice);
            setSpPrice("");
        };

        const handleQty = () => {
            setHaveQty(!haveQty);
        };

        const handleSuccessPageType = (e) => {
            setPageType(e.target.value);
            setpageUrl("");
            setParsedContent("");
        };

        const catValue = (event) => {
            const { value, checked } = event.target;
            if (checked) {
                setCheckboxes([...checkboxes, value]);
            } else {
                setCheckboxes(checkboxes.filter((item) => item !== value));
            }
        };

        const handelInputs = (e) => {
            setShopItem({
                ...shopItem,
                [e.target.name]: e.target.value,
            });
        };

        const addCategory = () => {
            const value = inputRef.current.value;
            setAdding(true);
            axios
                .post(`/shop/add/save-category`, { category: value })
                .then((res) => {
                    if (res.data.status) {
                        successAlert(res.data.msg || "Added");
                        inputRef.current.value = "";
                        fetchAddedCategories();
                    } else {
                        errorAlert(res.data.msg || "Something went wrong.");
                    }
                    setAdding(false);
                })
                .catch((err) => {
                    setAdding(false);
                    errorsHandling(err);
                });
        };

        const addShopItem = () => {
            if (!physical) {
                if (!pagetype) {
                    errorAlert("Please select a success page type");
                    return false;
                }
                if (!rewardfile && pagetype === "text") {
                    errorAlert("Please add the item for sale (file)");
                    return false;
                }
                if (pagetype === "url" && !pageUrl) {
                    errorAlert("Success page url can not be empty");
                    return false;
                }
                if (pagetype === "text" && !parsedContent) {
                    errorAlert("Success page content can not be empty");
                    return false;
                }
            }
            if (physical && !String(shipping_info || "").trim()) {
                errorAlert("Shipping information can not be empty");
                return false;
            }

            if (!isChecked) {
                return false;
            }

            const updatedShipping = () => {
                const arr = [];
                if (domesticShipping !== "" && Number(domesticShipping) >= 0) {
                    arr.push({ country: auth?.user?.country_code || 'GB', price: domesticShipping });
                }
                if (wwsShipping !== "" && Number(wwsShipping) >= 0) {
                    arr.push({ country: "all", price: wwsShipping });
                }
                return arr;
            };

            const ships = updatedShipping();
            if (physical && ships.length < 1) {
                errorAlert("Please add at least one shipping method");
                return false;
            }
            setLoading(true);

            const data = {
                ...shopItem,
                success_page_value:
                    physical ? null : (pagetype === "url" ? pageUrl : parsedContent),
                reward_file: physical ? null : rewardfile,
                category:
                    checkboxes && checkboxes.length
                        ? JSON.stringify(checkboxes)
                        : "",
                ask_question: question,
                slot_limitation: slots || "",
                special_member_price: spPrice || "",
                quantity_allow: haveQty ? 1 : 0,
                shipping: JSON.stringify(ships),
                shipping_profile_id: null,
                shipping_info: shipping_info,
                varients: "",
                image: thumb,
                ai_generated: IsAiImage ? 1 : 0,
                price: shopItem.price,
                success_page_type: physical ? null : ((item && item.success_page_type) || pagetype),
            };
            axios
                .post(`/shop/add`, data)
                .then((res) => {
                    if (res.data.status) {
                        resetUploader();
                        setOpen(false);
                        window.dispatchEvent(new Event("closeAddOptions"));
                        window.dispatchEvent(new Event("shop:item-changed"));
                        setTimeout(() => {
                            successAlert(res.data.msg || "Item Added !!");
                            setOpen();
                        }, [100]);
                        update && update();
                    } else {
                        errorAlert(
                            res.data.msg || "Failed to add a shop item.",
                        );
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                    errorsHandling(err);
                });
        };

        const updateItem = () => {
            if (!physical) {
                if (!pagetype) {
                    errorAlert("Please select a success page type");
                    return false;
                }
                if (!rewardfile && pagetype === "text" && (!item || !item.reward_file_url)) {
                    errorAlert("Please add the item for sale (file)");
                    return false;
                }
                if (pagetype === "url" && !pageUrl) {
                    errorAlert("Success page url can not be empty");
                    return false;
                }
                if (pagetype === "text" && !parsedContent) {
                    errorAlert("Success page content can not be empty");
                    return false;
                }
            }
            if (physical && !String(shipping_info || "").trim()) {
                errorAlert("Shipping information can not be empty");
                return false;
            }

            if (!isChecked) {
                return false;
            }
            const updatedShipping = () => {
                const arr = [];
                if (domesticShipping !== "" && Number(domesticShipping) >= 0) {
                    arr.push({ country: auth?.user?.country_code || 'GB', price: domesticShipping });
                }
                if (wwsShipping !== "" && Number(wwsShipping) >= 0) {
                    arr.push({ country: "all", price: wwsShipping });
                }
                return arr;
            };

            const ships = updatedShipping();

            if (physical && ships.length < 1) {
                errorAlert("Please add at least one shipping method");
                return false;
            }
            setLoading(true);

            const data = {
                ...shopItem,
                success_page_value:
                    physical ? null : (pagetype === "url" ? pageUrl : parsedContent),
                reward_file: physical ? null : rewardfile,
                category:
                    checkboxes && checkboxes.length
                        ? JSON.stringify(checkboxes)
                        : "",
                ask_question: question,
                slot_limitation: slots || "",
                special_member_price: spPrice || "",
                quantity_allow: haveQty ? 1 : 0,
                shipping: JSON.stringify(ships),
                shipping_profile_id: null,
                shipping_info: shipping_info,
                varients: "",
                image: thumb,
                success_page_type: physical ? null : pagetype,
                ai_generated: IsAiImage ? 1 : 0,
                price: shopItem.price,
            };
            axios
                .post(`/shop/update/${item.uuid}`, data)
                .then((res) => {
                    if (res.data.status) {
                        resetUploader();
                        window.dispatchEvent(new Event("closeAddOptions"));
                        window.dispatchEvent(new Event("shop:item-changed"));
                        setTimeout(() => {
                            successAlert(res.data.msg || "Item Added !!");
                            setOpen();
                        }, [100]);
                        update && update();
                    } else {
                        errorAlert(
                            res.data.msg || "Failed to add a shop item.",
                        );
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                    errorsHandling(err);
                });
        };

        const AddItem = () => {
            return (
                <div className=" flex items-center">
                    <div className="p-1 rounded-[30px]   bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                        <AiOutlineShop color="var(--pink)" size="1.5rem" />
                    </div>
                    <div className="pl-3 text-left">
                        <h2 className="text-lg font-normal font-GillSans uppercase ">
                            Sell Something
                        </h2>
                        <p className="text-sm font-poppins">
                            Sell digital or physical items from your page
                        </p>
                    </div>
                </div>
            );
        };

        const addVariant = () => {
            setVariants([...variants, { name: "", value: "" }]);
        };
        const handleVariantChange = (index, field, value) => {
            const newVariants = variants.map((variant, i) =>
                i === index ? { ...variant, [field]: value } : variant,
            );
            setVariants(newVariants);
        };
        const handleRemoveVariant = (index) => {
            const newVariants = variants.filter((_, i) => i !== index);
            setVariants(newVariants);
        };
        return (
            <Popup
                modalclass="addShopItems modals full"
                size="xl"
                action={open}
                text={title || <AddItem />}
                classes={`${classes ? classes : "px-3 py-2"}`}
            >
                <div className=" overflow-auto bg-white md:bg-gray-200 h-full">
                    <div className="flex items-center justify-center py-3 bg-white sticky -top-4 z-10 w-full">
                        <h2 className="text-[22px]">What are you offering?</h2>
                    </div>
                    <div className="shop-forms-field m-auto rounded-[30px] ">
                        {/* Basic Information Section */}
                        <div className="bg-white p-6 rounded-[30px]   mb-6 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                                Basic Information
                            </h3>
                            <div className="shop-forms-field mb-4">
                                <label className="w-full mb-1.5">
                                    {" "}
                                    Select what you're offering{" "}
                                </label>
                                <Select
                                    defaultValue={
                                        product_type
                                            ? lists.filter(
                                                  (item) =>
                                                      item.value ===
                                                      product_type,
                                              )
                                            : {
                                                  value: "Digital Products",
                                                  label: "Digital Products",
                                              }
                                    }
                                    classNamePrefix="react-select"
                                    className="react-select-lists mb-4 mt-2 "
                                    options={lists}
                                    onChange={handleLists}
                                    placeholder={
                                        "Select what you’re offering.."
                                    }
                                />
                            </div>

                            <div className="shop-forms-field mb-4">
                                <label className="w-full mb-2">Name*</label>
                                <input
                                    name="name"
                                    value={shopItem.name}
                                    onChange={handelInputs}
                                    className="shop-forms-input bg-gray-200 w-full  border-0 rounded-[30px]  p-3 px-3.5"
                                    type="text"
                                    placeholder="What are you offering ?"
                                />
                            </div>

                            <div className="shop-forms-field mb-4">
                                <label className="w-full mb-2">
                                    Description*
                                </label>
                                <input
                                    name="description"
                                    value={shopItem.description}
                                    onChange={handelInputs}
                                    className="shop-forms-input bg-gray-200 w-full  border-0 rounded-[30px]  p-3 px-3.5"
                                    type="text"
                                    placeholder="Describe what you’re selling ?"
                                />
                            </div>

                            <div className="shop-forms-field mb-4">
                                <label className="w-full mb-2">
                                    Price ({defaultCurrency})*
                                </label>
                                <div className="relative ">
                                    <span className="currency-tag">
                                        {defaultCurrency}
                                    </span>
                                    <input
                                        name="price"
                                        value={shopItem.price}
                                        onChange={handelInputs}
                                        className="shop-forms-input bg-gray-200 w-full  border-0 rounded-[30px]  p-[12px] px-[20px] !ps-[55px]  "
                                        type="number"
                                        placeholder="Enter the price of your item"
                                    />
                                </div>
                                {shopItem.price > 0 && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-[20px] border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600">Fans pay:</span>
                                            <span className="font-bold text-gray-900">
                                                {new Intl.NumberFormat('en-GB', { 
                                                    style: 'currency', 
                                                    currency: defaultCurrency 
                                                }).format(calculateTotalSupporterPays(shopItem.price, defaultCurrency).total_supporter_pays)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">You receive:</span>
                                            <span className="font-bold text-green-600">
                                                {new Intl.NumberFormat('en-GB', { 
                                                    style: 'currency', 
                                                    currency: defaultCurrency 
                                                }).format(shopItem.price)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 font-medium">Fans only see the total price to improve conversion</p>
                                    </div>
                                )}
                                {defaultCurrency !== global_currency &&
                                    shopItem.price > 0 && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            ≈{" "}
                                            {formatMultiPrice(
                                                shopItem.price,
                                                defaultCurrency,
                                            )}{" "}
                                            ({global_currency})
                                        </p>
                                    )}
                            </div>

                            <h2 className="text-md font-normal mb-3 mt-3">
                                Item image
                            </h2>
                            {isEdit ? (
                                <img
                                    alt="image-profile"
                                    className="w-full max-h-[500px] object-cover h-auto rounded-[30px] "
                                    src={item && item.perma_link}
                                />
                            ) : (
                                ""
                            )}
                            <div
                                className={`uploader mb-4 mt-2 overflow-hidden`}
                            >
                                <GlobalUploader
                                    ctxName="add-shop1-context"
                                    type="minimal"
                                    ref={uploaderRef}
                                    sendFile={getFileUID}
                                    options={st.shop}
                                />
                                <div
                                    className={`${thumbEditable ? "" : "hidden"} editable`}
                                >
                                    <UploadcareEditor
                                        setIsEditable={setIsThumbEditable}
                                        uuid={thumb}
                                        updateFile={imageEdited}
                                    />
                                </div>
                            </div>

                            {physical ? (
                                <>
                                    <div className="shipping-setup-options border-t border-gray-100 pt-4 mt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-md font-bold">Shipping Setup</h2>
                                        </div>

                                        <div className="simple-shipping-fields grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div className="field">
                                                <label className="text-sm block mb-1">Domestic (My Country)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-gray-500 text-sm">{new Intl.NumberFormat('en', { style: 'currency', currency: defaultCurrency }).formatToParts(0).find(p => p.type === 'currency')?.value}</span>
                                                    <input 
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="shop-forms-input pl-8 bg-gray-200 w-full border-0 rounded-[30px] p-[12px] px-[20px]"
                                                        value={domesticShipping}
                                                        onChange={(e) => setDomesticShipping(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="field">
                                                <label className="text-sm block mb-1">Worldwide (Everywhere else)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-gray-500 text-sm">{new Intl.NumberFormat('en', { style: 'currency', currency: defaultCurrency }).formatToParts(0).find(p => p.type === 'currency')?.value}</span>
                                                    <input 
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="shop-forms-input pl-8 bg-gray-200 w-full border-0 rounded-[30px] p-[12px] px-[20px]"
                                                        value={wwsShipping || ''}
                                                        onChange={(e) => setwwsShipping(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="font-bold pt-4 border-t border-gray-200 mb-2">
                                        Shipping Information
                                    </h2>
                                    <input
                                        type="text"
                                        className="shop-forms-input bg-gray-200 w-full border-0
                            mb-6 rounded-[30px]  p-[12px] px-[20px]"
                                        name={`shipping-information`}
                                        value={shipping_info}
                                        placeholder="Shipping information.."
                                        onChange={(e) =>
                                            setShipping_info(e.target.value)
                                        }
                                    />
                                </>
                            ) : (
                                <div className="shop-forms-field mb-4">
                                    <label className="w-full mb-2">
                                        Success page *{" "}
                                    </label>
                                    <div className="success-page-types flex items-center flex-wrap">
                                        <div className="flex items-center mb-2 pr-3">
                                            <input
                                                onChange={handleSuccessPageType}
                                                defaultChecked={
                                                    item &&
                                                    item.success_page_type ==
                                                        "text"
                                                        ? true
                                                        : false
                                                }
                                                id="success-option-1"
                                                type="radio"
                                                name="success-types"
                                                value="text"
                                                className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                            />
                                            <label
                                                htmlFor="success-option-1"
                                                className=" cursor-pointer text-base font-medium text-gray-900 ml-2 block"
                                            >
                                                Confirmation message
                                            </label>
                                        </div>
                                        <div className="flex items-center mb-2 ">
                                            <input
                                                onChange={handleSuccessPageType}
                                                defaultChecked={
                                                    item &&
                                                    item.success_page_type ==
                                                        "url"
                                                        ? true
                                                        : false
                                                }
                                                id="success-option-2"
                                                type="radio"
                                                name="success-types"
                                                value="url"
                                                className="h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                            />
                                            <label
                                                htmlFor="success-option-2"
                                                className=" cursor-pointer text-md font-medium text-gray-900 ml-2 block"
                                            >
                                                Redirect to a URL after purchase
                                            </label>
                                        </div>
                                    </div>

                                    {pagetype == "text" ? (
                                        <div className="">
                                            <textarea
                                                value={parsedContent}
                                                onChange={(e) =>
                                                    setParsedContent(
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-2 shop-forms-input bg-gray-200 w-full border-0 rounded-[30px]  p-3 px-3.5"
                                                placeholder="Enter confirmation message here !!"
                                            ></textarea>
                                            <h2 className="text-md font-normal mb-3 mt-2">
                                                {" "}
                                                Add the item for sale
                                                (Video,Images,Audio,or PDF) *
                                            </h2>
                                            <div
                                                className={`uploader mb-4 mt-2 overflow-hidden`}
                                            >
                                                {/* image */}
                                                {item &&
                                                item.reward_file_type ==
                                                    "image" ? (
                                                    <img
                                                        alt="image-profile"
                                                        className=" mb-4 w-full max-h-[500px] object-cover h-auto rounded-[30px] "
                                                        src={
                                                            item &&
                                                            item.reward_file_url
                                                        }
                                                    />
                                                ) : (
                                                    ""
                                                )}

                                                {/* video */}
                                                {item &&
                                                item.reward_file_type ==
                                                    "video" ? (
                                                    <video
                                                        controls
                                                        playsInline
                                                        className=" mb-4 w-full max-h-[500px] object-cover h-auto rounded-[30px] "
                                                        src={
                                                            item &&
                                                            item.reward_file_url
                                                        }
                                                    />
                                                ) : (
                                                    ""
                                                )}

                                                {/* audio */}
                                                {item &&
                                                item.reward_file_type ==
                                                    "audio" ? (
                                                    <audio
                                                        controls
                                                        playsInline
                                                        className=" mb-4 w-full object-cover h-[50px] rounded-[30px] "
                                                        src={
                                                            item &&
                                                            item.reward_file_url
                                                        }
                                                    />
                                                ) : (
                                                    ""
                                                )}
                                                {/* video */}
                                                {item &&
                                                item.reward_file_type ==
                                                    "application" ? (
                                                    <iframe
                                                        className=" mb-4 w-full  max-h-[500px] object-cover h-full rounded-[30px] "
                                                        src={
                                                            item &&
                                                            item.reward_file_url
                                                        }
                                                    />
                                                ) : (
                                                    ""
                                                )}

                                                {IsAiImage ? (
                                                    <img
                                                        alt="image-profile"
                                                        className=" mb-2 mt-1 w-full max-h-[500px] object-cover h-auto rounded-[30px] "
                                                        src={IsAiImage}
                                                    />
                                                ) : (
                                                    ""
                                                )}
                                                <GlobalUploader
                                                    ctxName="add-shop2-context"
                                                    type="minimal"
                                                    ref={uploaderRef}
                                                    sendFile={getRewardFile}
                                                    options={st.shopreward}
                                                />
                                                {/* <div className="flex justify-center">
                                                    <div>
                                                        <h2 className="text-center text-gray-400 py-3">
                                                            Or
                                                        </h2>
                                                        <ImageGenerationWithAI
                                                            update={getAIImage}
                                                        />
                                                    </div>
                                                </div> */}
                                            </div>
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                    {pagetype == "url" ? (
                                        <input
                                            value={pageUrl}
                                            onChange={(e) =>
                                                setpageUrl(e.target.value)
                                            }
                                            className="mt-2 shop-forms-input bg-gray-200 w-full border-0 rounded-[30px]  p-3 px-3.5"
                                            type="text"
                                            placeholder="https://"
                                        />
                                    ) : (
                                        ""
                                    )}
                                </div>
                            )}

                            <div className="shop-add-categories border-t pt-3 ">
                                <h2 className="text-lg font-bold mb-2">
                                    Choose Categories
                                </h2>
                                <div className="categories-lists grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 success-page-types">
                                    {categories &&
                                        categories.map((c, i) => {
                                            const isCategory = (
                                                item?.real_category ?? []
                                            ).some((rc) => rc?.uuid === c?.uuid);
                                            return (
                                                <div
                                                    key={c.uuid ?? i}
                                                    className="flex items-center mb-2"
                                                >
                                                    <input
                                                        onChange={catValue}
                                                        defaultChecked={
                                                            isCategory
                                                        }
                                                        id={`category-item-${c.uuid}`}
                                                        type="checkbox"
                                                        name="categories-items"
                                                        value={c.uuid}
                                                        className="h-5 w-5 rounded-[30px]   border-gray-300 focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                                    />
                                                    <label
                                                        htmlFor={`category-item-${c.uuid}`}
                                                        className=" cursor-pointer text-base font-medium text-gray-900 ml-2 block"
                                                    >
                                                        {c.category}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                </div>

                                <div className="add-shop-cat-input relative flex items-center mt-3">
                                    <input
                                        ref={inputRef}
                                        className="shop-forms-input bg-gray-200 w-full border-0 rounded-[30px]  p-[13px] px-4"
                                        type="text"
                                        placeholder="Enter new category"
                                    />
                                    <button
                                        onClick={addCategory}
                                        className="bg-gray-200 rounded-[30px]  ml-3 p-[13px] px-4 whitespace-nowrap"
                                    >
                                        {" "}
                                        + Add
                                    </button>
                                </div>
                            </div>
                            <details className="border-t pt-3 mt-4">
                                <summary className="text-lg font-bold cursor-pointer">
                                    Advanced Settings
                                </summary>

                                <div className="ad-setting my-2">
                                    <div className="inline-flex items-center cursor-pointer">
                                        <div
                                            onClick={handleHaveQuestion}
                                            className={` cursor-pointer relative w-11 h-6  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5
                                        ${haveQuestion ? "after:transition-all after:translate-x-full bg-blue-600" : "bg-gray-200"}
                                        `}
                                        ></div>
                                        <span className="ml-3 text-base font-medium text-gray-900">
                                            Ask a question (optional)
                                            <button className="tooltipbtn">
                                                ?
                                                <p>
                                                    {" "}
                                                    If you'd like any additional
                                                    information to fulfil this
                                                    offering,you can leave a
                                                    question here.{" "}
                                                </p>
                                            </button>
                                        </span>
                                    </div>
                                    {haveQuestion ? (
                                        <input
                                            value={question}
                                            onChange={(e) =>
                                                setQuestion(e.target.value)
                                            }
                                            className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full border-0 rounded-[30px]  p-[13px] px-4"
                                            type="text"
                                            placeholder="e.g What would like to learn next ?"
                                        />
                                    ) : (
                                        ""
                                    )}
                                </div>

                                <div className="ad-setting my-2">
                                    <div className="inline-flex items-centercursor-pointer">
                                        <div
                                            onClick={handleHaveSlots}
                                            className={` cursor-pointer relative w-11 h-6  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 ${
                                                haveSlots
                                                    ? "after:transition-all after:translate-x-full  bg-blue-600"
                                                    : "bg-gray-200"
                                            }`}
                                        ></div>
                                        <span className="ml-3 text-md font-medium text-gray-900">
                                            Limit slots (optional)
                                            <button className="tooltipbtn">
                                                {" "}
                                                ?
                                                <p>
                                                    A limited number of slots
                                                    creates a sense of urgency and
                                                    also saves you from burn-out.
                                                </p>
                                            </button>
                                        </span>
                                    </div>
                                    {haveSlots ? (
                                        <input
                                            onChange={(e) =>
                                                setSlots(e.target.value)
                                            }
                                            value={slots}
                                            className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full border-0 rounded-[30px]  p-[13px] px-4"
                                            type="text"
                                        />
                                    ) : (
                                        ""
                                    )}
                                </div>

                                {shopItem && shopItem.type !== "physical" ? (
                                    <>
                                        <div className="ad-setting my-2">
                                            <div className="inline-flex items-center cursor-pointer">
                                                <label
                                                    className="relative flex items-center p-3 rounded-full cursor-pointer"
                                                    htmlFor="check3"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-[30px]  border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-gray-900 checked:bg-gray-900 checked:before:bg-gray-900 hover:before:opacity-10"
                                                        id="check3"
                                                        onChange={handleSpPrice}
                                                        checked={haveSpPrice}
                                                    />
                                                    <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-3.5 w-3.5"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                            stroke="currentColor"
                                                            strokeWidth="1"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            ></path>
                                                        </svg>
                                                    </span>
                                                </label>
                                                <span className="ml-3 text-base font-medium text-gray-900">
                                                    Special Price for Members (
                                                    {defaultCurrency})
                                                </span>
                                            </div>
                                            {haveSpPrice ? (
                                                <>
                                                    <input
                                                        onChange={(e) =>
                                                            setSpPrice(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full  border-0 rounded-[30px]  p-[13px] px-4"
                                                        type="text"
                                                        value={spPrice}
                                                    />
                                                    {defaultCurrency !==
                                                        global_currency &&
                                                        spPrice > 0 && (
                                                            <p className="mb-3 text-sm text-gray-500">
                                                                ≈{" "}
                                                                {formatMultiPrice(
                                                                    spPrice,
                                                                    defaultCurrency,
                                                                )}{" "}
                                                                ({global_currency})
                                                            </p>
                                                        )}
                                                </>
                                            ) : (
                                                ""
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    ""
                                )}

                                <div className="hidden ad-setting my-2">
                                    <div className="inline-flex items-centercursor-pointer">
                                        <div
                                            onClick={handleQty}
                                            className={` cursor-pointer relative w-11 h-6   peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5
                                        ${
                                            haveQty
                                                ? "after:transition-all after:translate-x-full  bg-blue-600"
                                                : "bg-gray-200"
                                        } `}
                                        ></div>
                                        <span className="ml-3 text-md font-medium text-gray-900">
                                            Allow buyer to choose a quantity
                                            (optional){" "}
                                            <button className="tooltipbtn">
                                                ?
                                                <p>
                                                    Your supporters will be able to
                                                    select the desired quantity of
                                                    this item. You will receive
                                                    payment based on the quantity
                                                    They've chosen multiplied by
                                                    your set price.
                                                </p>
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </details>

                            <div className="isCheckedRefernce py-4">
                                <label htmlFor="agreeterm" className="text-left">
                                    <input
                                        onChange={(e) =>
                                            setIsChecked(e.target.checked)
                                        }
                                        type="checkbox"
                                        id="agreeterm"
                                        name="agreeterm"
                                        className="mr-2 rounded-[30px]   cursor-pointer"
                                        value="agreeterm"
                                    ></input>
                                    By adding shop item you agree to our{" "}
                                    <a
                                        className="text-voilet font-bold"
                                        target="_blank"
                                        href={route("terms-and-conditions")}
                                    >
                                        Terms & Conditions
                                    </a>{" "}
                                    and{" "}
                                    <a
                                        className="text-voilet font-bold"
                                        target="_blank"
                                        href={route("terms-and-conditions")}
                                    >
                                        Privacy Policy,
                                    </a>{" "}
                                    and confirm that you are at least 18 years old.
                                </label>
                            </div>

                            {isEdit ? (
                                <button
                                    disabled={!isChecked}
                                    onClick={updateItem}
                                    className="mt-4 mb-4 btn-pink md w-full max-w-[300px] m-auto d-table"
                                >
                                    {loading ? "Updating..." : "Update"}
                                </button>
                            ) : (
                                <button
                                    disabled={!isChecked}
                                    onClick={addShopItem}
                                    className="mt-4 mb-4 btn-pink md w-full max-w-[300px] m-auto d-table"
                                >
                                    {loading ? "Publishing..." : "Publish"}
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </Popup>
        );
    };

    return (
        <>
            <AddForm />
        </>
    );
}
