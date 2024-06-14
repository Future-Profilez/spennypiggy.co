import { useAlerts } from "@/Components/Alerts";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import React from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import st from "../../../css/uploader.module.css";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import GlobalUploader from "@/uploadcare/Uploader";
import Popup from "@/Components/Popup";
import { IoAddSharp } from "react-icons/io5";
import ChangeVat from "../account/ChangeVat";

export default function AddItem(props){
    const { auth, user } = usePage().props;
    const {item, update, title, pre_title, pre_description, pre_price, product_type, classes, isEdit } = props;
      console.log("auth",auth);
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
         const [isVat, setIsVat] = useState(auth && auth.user && auth.user.vat_amount_percentage ? true : false);
         const [vatpercent, setvatpercent] = useState((auth && auth?.user?.vat_amount_percentage) || "");
         const [passClose, setSassClose] = useState(false);
        const [categories, setCategories] = useState([]);
        const [fetchingCats, setFetchingCats] = useState(false);
        const [thumb, setThumb] = useState(null);
        const [thumbEditable, setIsThumbEditable] = useState(false);
        const [rewardfile, setrewardfile] = useState(null);
        const [haveQuestion, setHaveQuestion] = useState(item && item.ask_question ? true : false);
        const [question, setQuestion] = useState(
            (item && item.ask_question) || ""
        );
        const [haveSlots, setHaveSlots] = useState(
            item && item.slot_limitation ? true : false
        );
        const [slots, setSlots] = useState(
            (item && item.slot_limitation) || ""
        );
        const [haveSpPrice, setHaveSpPrice] = useState(
            item && item.special_member_price ? true : false
        );
        const [spPrice, setSpPrice] = useState(
            (item && item.special_member_price) || ""
        );
        const [haveQty, setHaveQty] = useState(
            item && item.quantity_allow ? true : false
        );
        const [pagetype, setPageType] = useState(
            (item && item.success_page_type) || false
        );
        const [parsedContent, setParsedContent] = useState(
            (item && item.success_page_value) || ""
        );
        const [pageUrl, setpageUrl] = useState(
            (item && item.success_page_value) || ""
        );
        const [checkboxes, setCheckboxes] = useState([]);
        const [real_category, setreal_category] = useState(
            item && item.category
        );
        const [shopItem, setShopItem] = useState({
            type: product_type,
            name: pre_title || "",
            description: pre_description || "",
            price: pre_price || "",
        });

        useEffect(() => {
            let arr = [];
            item && item.real_category.forEach((element) => {
              arr.push(element.uuid);
            });
            setCheckboxes(arr);
        }, [item && item.category]);

        const [isChecked, setIsChecked] = useState(false);
        const [adding, setAdding] = useState(false);
        const inputRef = useRef(null);
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            const controller = new AbortController();
            const { signal } = controller;
            fetchAddedCategories(signal);
            return () => controller.abort();
        }, []);

        const fetchAddedCategories = (signal) => {
            if (fetchingCats) return;
            setFetchingCats(true);
            axios
                .get(
                    `/user_shop_category/${
                        auth.user.username || user.username
                    }`,
                    { signal }
                )
                .then((res) => {
                    setCategories(res.data.categories);
                    setFetchingCats(false);
                })
                .catch((err) => {
                    console.log(err);
                    setFetchingCats(false);
                });
        };

        const uploaderRef = useRef();
        const resetUploader = () => {
            if(uploaderRef.current){uploaderRef.current.reset()}
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
            console.log("file", file);
        }

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

        const [haveVat, sethaveVat] = useState(item && item.vat_applicable ? 1 : 0);

        const handleVat = () => {
            if(!isVat && haveVat == 0){
               console.log(isVat, haveVat);
               setSassClose(false);
               setTimeout(() => {
               setSassClose(true);
               }, 100);
               return false
            } else {
               if(haveVat == 0) {
                  sethaveVat(1);
               }else {
                  sethaveVat(0);
               }
            }
        };

         const updatevat = (e) => {
            sethaveVat(1);
            setIsVat(true);
            setSassClose(false);
            console.log("vat", e);
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
                .post(`/shop/save-category`, { category: value })
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
            if (!isChecked) {
                return false;
            }
            setLoading(true);
            const data = {
                ...shopItem,
                success_page_value:
                    pagetype === "url" ? pageUrl : parsedContent,
                reward_file: rewardfile,
                category:
                    checkboxes && checkboxes.length
                        ? JSON.stringify(checkboxes)
                        : "",
                ask_question: question,
                slot_limitation: slots || "",
                special_member_price: spPrice || "",
                quantity_allow: haveQty ? 1 : 0,
                vat_applicable: haveVat,
                image: thumb,
                success_page_type: (item && item.success_page_type) || pagetype,
            };
            axios
                .post(`/shop/add`, data)
                .then((res) => {
                    if (res.data.status) {
                        successAlert(res.data.msg || "Item Added !!");
                        resetUploader();
                        setOpen(false);
                        update && update();
                    } else {
                        errorAlert(
                            res.data.msg || "Failed to add a shop item."
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
            if (!isChecked) {
                return false;
            }
            setLoading(true);
            const data = {
                ...shopItem,
                success_page_value:
                    pagetype === "url" ? pageUrl : parsedContent,
                reward_file: rewardfile,
                category:
                    checkboxes && checkboxes.length
                        ? JSON.stringify(checkboxes)
                        : "",
                ask_question: question,
                slot_limitation: slots || "",
                special_member_price: spPrice || "",
                quantity_allow: haveQty ? 1 : 0,
                image: thumb,
                vat_applicable: haveVat,
                success_page_type: pagetype,
            };
            axios
                .post(`/shop/update/${item.uuid}`, data)
                .then((res) => {
                    if (res.data.status) {
                        successAlert(res.data.msg || "Item Added !!");
                        resetUploader();
                        setOpen(false);
                        update && update();
                    } else {
                        errorAlert(
                            res.data.msg || "Failed to add a shop item."
                        );
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                    errorsHandling(err);
                });
        };

        const Add = () => {
            return (
                <div className="flex items-center">
                    <IoAddSharp size="2rem" />
                    <h2 className="ms-2">Add Digital Product</h2>
                </div>
            );
        };

        return (
            <Popup
                modalclass="addShopItem modal full"
                size="lg"
                action={close}
                text={title || <Add />}
                classes={`${classes ? classes : "px-3 py-2"}`}
            >
                <div className="p-3 md:p-8 overflow-auto bg-white md:bg-gray-200 h-full">
                    <div className="flex items-center justify-center py-3 bg-white sticky -top-4 w-full mb-6">
                        <h2 className="text-[22px]">What are you offering?</h2>
                    </div>
                    {/* <button className='fixed top-1 md:top-2 right-8 md:right-10 z-1 text-[35px] md:text-[45px]' onClick={()=>setOpen(false)} >&times;</button> */}
                    <div className="shop-forms-field p-0 md:p-8 max-w-[800px] m-auto rounded-[20px]">
                        <div className="shop-forms-field mb-4">
                            <label className="w-full mb-2">Name*</label>
                            <input
                                name="name"
                                defaultValue={pre_title}
                                onChange={handelInputs}
                                className="shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5"
                                type="text"
                                placeholder="What are you offering ?"
                            />
                        </div>

                        <div className="shop-forms-field mb-4">
                            <label className="w-full mb-2">Description*</label>
                            <input
                                name="description"
                                defaultValue={pre_description}
                                onChange={handelInputs}
                                className="shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5"
                                type="text"
                                placeholder="Describe what you’re selling in a few sentences"
                            />
                        </div>

                        <div className="shop-forms-field mb-4">
                            <label className="w-full mb-2">Price*</label>
                            <input
                                name="price"
                                defaultValue={pre_price}
                                onChange={handelInputs}
                                className="shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5"
                                type="number"
                                placeholder="Enter the price of your item"
                            />
                        </div>

                        <h2 className="text-md font-normal mb-3 mt-3">
                            Item image
                        </h2>

                        {isEdit ? (
                            <>
                                <img
                                    alt="image-profile"
                                    className="w-full max-h-[500px] object-cover h-auto rounded-4"
                                    src={item && item.perma_link}
                                />
                            </>
                        ) : (
                            ""
                        )}
                        <div className={`uploader mb-4 mt-2 overflow-hidden`}>
                            <GlobalUploader
                                type="minimal"
                                ref={uploaderRef}
                                sendFile={getFileUID}
                                options={st.shop}
                            />
                            <div
                                className={`${
                                    thumbEditable ? "" : "d-none"
                                } editable`}
                            >
                                <UploadcareEditor
                                    setIsEditable={setIsThumbEditable}
                                    uuid={thumb}
                                    updateFile={imageEdited}
                                />
                            </div>
                        </div>

                        <div className="shop-forms-field mb-4">
                            <label className="w-full mb-2">
                                Success page *{" "}
                            </label>
                            <div className="success-page-types flex items-center flex-wrap">
                                <div className="flex items-center mb-2 pe-3">
                                    <input
                                        onChange={handleSuccessPageType}
                                        defaultChecked={
                                            item &&
                                            item.success_page_type == "text"
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
                                        className=" cursor-pointer text-md font-medium text-gray-900 ml-2 block"
                                    >
                                        Confirmation message
                                    </label>
                                </div>
                                <div className="flex items-center mb-2 ">
                                    <input
                                        onChange={handleSuccessPageType}
                                        defaultChecked={
                                            item &&
                                            item.success_page_type == "url"
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
                                        defaultValue={parsedContent}
                                        onChange={(e) =>
                                            setParsedContent(e.target.value)
                                        }
                                        className="mt-2 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5"
                                        placeholder="Enter confirmation message here !!"
                                    ></textarea>
                                    <h2 className="text-md font-normal mb-3 mt-2">
                                        Add the item for sale (Video, Images,
                                        Audio, or PDF) *{" "}
                                    </h2>
                                    <div
                                        className={`uploader mb-4 mt-2 overflow-hidden`}
                                    >
                                        {item ? (
                                            <>
                                                {item &&
                                                item.reward_file_type ==
                                                    "image" ? (
                                                    <img
                                                        alt="image-profile"
                                                        className=" mb-4 w-full max-h-[500px] object-cover h-auto rounded-4"
                                                        src={
                                                            item &&
                                                            item.reward_file_url
                                                        }
                                                    />
                                                ) : (
                                                    <video
                                                        controls
                                                        playsInline
                                                        className=" mb-4 w-full max-h-[500px] object-cover h-auto rounded-4"
                                                        src={
                                                            item &&
                                                            item.reward_file_url
                                                        }
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            ""
                                        )}

                                        <GlobalUploader
                                            type="minimal"
                                            ref={uploaderRef}
                                            sendFile={getRewardFile}
                                            options={st.shopreward}
                                        />
                                    </div>
                                </div>
                            ) : (
                                ""
                            )}
                            {pagetype == "url" ? (
                                <input
                                    defaultValue={pageUrl}
                                    onChange={(e) => setpageUrl(e.target.value)}
                                    className="mt-2 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5"
                                    type="text"
                                    placeholder="https://"
                                />
                            ) : (
                                ""
                            )}
                        </div>

                        <div className="shop-add-categories border-t pt-3 ">
                            <h2 className="text-lg font-bold mb-2">
                                Choose Categories
                            </h2>
                            <div className="categories-lists success-page-types">
                                {categories &&
                                    categories.map((c, i) => {
                                        const filteritem =
                                            real_category &&
                                            real_category.filter(
                                                (item) =>
                                                    item?.category.category ==
                                                    c?.category
                                            );
                                        console.log("filteritem", filteritem);
                                        const isCategory =
                                            filteritem && filteritem[0]
                                                ? true
                                                : null;

                                        return (
                                            <div className="flex items-center mb-2">
                                                <input
                                                    onChange={catValue}
                                                    defaultChecked={isCategory}
                                                    id={`category-item-${c.uuid}`}
                                                    type="checkbox"
                                                    name="categories-items"
                                                    value={c.uuid}
                                                    className="h-5 w-5 rounded-1 border-gray-300 focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                                />
                                                <label
                                                    htmlFor={`category-item-${c.uuid}`}
                                                    className=" cursor-pointer text-md font-medium text-gray-900 ml-2 block"
                                                >
                                                    {c.category}
                                                </label>
                                            </div>
                                        );
                                    })}
                            </div>

                            <div className="add-shop-cat-input relative d-flex items-center mt-3">
                                <input
                                    ref={inputRef}
                                    className="shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4"
                                    type="text"
                                    placeholder="Enter new category"
                                />
                                <button
                                    onClick={addCategory}
                                    className="bg-gray-200 rounded-xl ms-3 p-[13px] px-4 text-nowrap"
                                >
                                    + Add
                                </button>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold mb-2 border-t pt-3 mt-4">
                            Advanced Settings
                        </h2>

                        <div className="ad-setting my-2">
                            <div className="inline-flex items-center cursor-pointer">
                                <div
                                    onClick={handleVat}
                                    className={` cursor-pointer relative w-11 h-6 
                         peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer  
                            peer-checked:after:border-white after:content-[''] 
                            after:absolute after:top-[2px] after:start-[2px] after:bg-white 
                            after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                        ${
                            haveVat == "1"
                                ? "after:transition-all after:translate-x-full  bg-blue-600"
                                : "bg-gray-200"
                        }
                        `}
                                ></div>
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Vat Applicable
                                    <button className="tooltipbtn">
                                        ?
                                        <p>
                                            Enable vat for this item of your
                                            choosen percentage.
                                        </p>
                                    </button>
                                </span>
                            </div>

                              <Popup action={passClose} space='4' modalclassName="pinkmodal">
                                <div className="addvat">
                                    <ChangeVat
                                        defaultvalue={vatpercent}
                                        updatevat={updatevat}
                                    />
                                </div>
                              </Popup>
                        </div>

                        <div className="ad-setting my-2">
                            <div className="inline-flex items-center cursor-pointer">
                                <div
                                    onClick={handleHaveQuestion}
                                    className={` cursor-pointer relative w-11 h-6  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                        ${
                            haveQuestion
                                ? "after:transition-all after:translate-x-full  bg-blue-600"
                                : "bg-gray-200"
                        }
                        `}
                                ></div>
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Ask a question (optional)
                                    <button className="tooltipbtn">
                                        ?
                                        <p>
                                            If you'd like any additional
                                            information to fulfil this offering,
                                            you can leave a question here.
                                        </p>
                                    </button>
                                </span>
                            </div>
                            {haveQuestion ? (
                                <input
                                    defaultValue={item && item.ask_question}
                                    onChange={(e) =>
                                        setQuestion(e.target.value)
                                    }
                                    className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4"
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
                                    className={` cursor-pointer relative w-11 h-6  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                        ${
                            haveSlots
                                ? "after:transition-all after:translate-x-full  bg-blue-600"
                                : "bg-gray-200"
                        }
                        `}
                                ></div>
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Limit slots (optional){" "}
                                    <button className="tooltipbtn">
                                        ?
                                        <p>
                                            A limited number of slots creates a
                                            sense of urgency and also saves you
                                            from burn-out.
                                        </p>
                                    </button>
                                </span>
                            </div>
                            {haveSlots ? (
                                <input
                                    onChange={(e) => setSlots(e.target.value)}
                                    className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4"
                                    type="text"
                                    defaultValue={slots || ""}
                                />
                            ) : (
                                ""
                            )}
                        </div>

                        <div className="ad-setting my-2">
                            <div className="inline-flex items-centercursor-pointer">
                                <div
                                    onClick={handleSpPrice}
                                    className={` cursor-pointer relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5  
                        ${
                            haveSpPrice
                                ? "after:transition-all after:translate-x-full bg-blue-600"
                                : "bg-gray-200 "
                        }
                        `}
                                ></div>
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Special price for members (optional){" "}
                                    <button className="tooltipbtn">
                                        ?
                                        <p>
                                            Offer a discounted extra price to
                                            attract new members and to keep your
                                            current members engaged.
                                        </p>
                                    </button>
                                </span>
                            </div>
                            {haveSpPrice ? (
                                <input
                                    onChange={(e) => setSpPrice(e.target.value)}
                                    className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4"
                                    type="text"
                                    defaultValue={spPrice || ""}
                                />
                            ) : (
                                ""
                            )}
                        </div>

                        <div className="ad-setting my-2">
                            <div className="inline-flex items-centercursor-pointer">
                                <div
                                    onClick={handleQty}
                                    className={` cursor-pointer relative w-11 h-6   peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                                    ${haveQty? "after:transition-all after:translate-x-full  bg-blue-600": "bg-gray-200"} `}
                                ></div>
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Allow buyer to choose a quantity (optional){" "}
                                    <button className="tooltipbtn">
                                        ?
                                        <p>
                                            Your supporters will be able to
                                            select the desired quantity of this
                                            item && item. You will receive
                                            payment based on the quantity they
                                            choose multiplied by your set price.
                                        </p>
                                    </button>
                                </span>
                            </div>
                        </div>

                        <div className="isCheckedRefernce py-4">
                            <label htmlFor="agreeterm" className="text-start">
                                <input
                                    onChange={(e) =>
                                        setIsChecked(e.target.checked)
                                    }
                                    type="checkbox"
                                    id="agreeterm"
                                    name="agreeterm"
                                    className="me-2 rounded-1 cursor-pointer"
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
                                    href={
                                        "https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                                    }
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
            </Popup>
        );
    };

    return (
        <>
            {/* <button onClick={(e)=>setOpen(true)} className={classes ? classes : 'w-full shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[20px]'} >
            <h2 className='md:text-[19px]' >{title}</h2>
         </button> */}

            <AddForm classes="w-full shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[20px]" />
        </>
    );
}
