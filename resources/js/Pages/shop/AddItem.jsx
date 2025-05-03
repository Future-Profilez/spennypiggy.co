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
import ChangeVat from "../account/ChangeVat";
import { AiOutlineShop } from "react-icons/ai";
import Select from "react-select";
import CountriesShipping from "./CountriesShipping";
import ImageGenerationWithAI from "@/Components/ImageGenerationWithAI";

const lists = [
    { value: "Digital Products", label: "Digital Products" },
    { value: "physical", label: 'Physical Product' },
    { value: "Custom Digital Artwork 🖼️", label: "Custom Digital Artwork 🖼️" },
    { value: "Custom Photoshoot 📷 ", label: "Custom Photoshoot 📷" },
    { value: "Video Happy Birthday 🎂 ", label: "Video Happy Birthday 🎂" },
    { value: "Custom Drawing ✍️ ", label: "Custom Drawing ✍️" },
    { value: "Nutrition Plan 🥬- pdf", label: "Nutrition Plan 🥬- pdf" },
    { value:"Personal Training Plan 💪🏻- pdf",label:"Personal Training Plan 💪🏻- pdf"},
    { value: "Style Guide 👗- pdf", label: "Style Guide 👗- pdf" },
    { value: "My E-Book 📕- pdf", label: "My E-Book 📕- pdf" },
];

const updatedVarients = (data) =>{
    const arr = [];
    data.forEach((v, i) => {
        if(v.name !== ''  && v.value !== "") {
            arr.push(v)
        }
    })
    return arr
};


export default function AddItem(props) {
    const { auth, user } = usePage().props;
    const defaultCurrency = user && user.default_currency || "GBP";

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
        const [isVat, setIsVat] = useState(
            auth && auth.user && auth.user.vat_amount_percentage ? true : false
        );
        const [vatpercent, setvatpercent] = useState((auth && auth?.user?.vat_amount_percentage) || "");
        const [passClose, setSassClose] = useState(false);
        const [categories, setCategories] = useState([]);
        const [fetchingCats, setFetchingCats] = useState(false);
        const [thumb, setThumb] = useState(null);
        const [thumbEditable, setIsThumbEditable] = useState(false);
        const [rewardfile, setrewardfile] = useState(null);
        const [haveQuestion, setHaveQuestion] = useState(
            item && item.ask_question ? true : false
        );
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
        const [pageUrl,setpageUrl] = useState( (item && item.success_page_value) || "" );
        const [checkboxes, setCheckboxes] = useState([]);
        const [real_category, setreal_category] = useState(item && item.category);
        const [shopItem, setShopItem] = useState({
            type: product_type || 'Digital Products',
            name: pre_title || "",
            description: pre_description || "",
            price: pre_price || '',
        });

        const [wwsShipping, setwwsShipping] = useState([]);
        const [shipping, setShipping] = useState([]);
        const [variants, setVariants] = useState([{ name: '', value: '' }]);
        const [shipping_info, setShipping_info] = useState('');

        const handleShipping = (e) =>{
            setShipping(e);
        }
        const handlewws = (e) => {
            setwwsShipping(e)
        }


        const [physical, setPhysical] = useState(shopItem && shopItem.type === "physical" ? true : false);
        const handleLists = (e) => {
            setShopItem({ ...shopItem, type: e.value });
            if(e.value === "physical"){
                setPhysical(e.value)
            } else {
                setPhysical(false)
            }
        };

        useEffect(() => {
            let arr = [];
            item && item.real_category.forEach((element) =>{
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

        const fetchAddedCategories = async (signal) => {
            if(fetchingCats){
                return false;
            }
            setFetchingCats(true);
            axios.get(`/user_shop_category/${auth.user.username || user.username}`,{signal}) .then((res) =>{
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
        const getAIImage = (e) =>{
            setrewardfile(e.uuid+'/-/text_align/left/center/-/font/10/fff/-/text/80px8p/8p,100p/Made%20with%20AI%20/-/format/jpeg/-/preview/');
            setIsAiImage(e.url);
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

        const [haveVat, sethaveVat] = useState(
            item && item.vat_applicable ? 1 : 0
        );

        const handleVat = () => {
            if (!isVat && haveVat == 0) {
                setSassClose(false);
                setTimeout(() => {
                    setSassClose(true);
                }, 100);
                return false;
            } else {
                if (haveVat == 0) {
                    sethaveVat(1);
                } else {
                    sethaveVat(0);
                }
            }
        };

        const updatevat = (e) => {
            sethaveVat(1);
            setIsVat(true);
            setSassClose(false);
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
            if (!physical) {
                if (!rewardfile && !pagetype) {
                    errorAlert("Please fill the required fields");
                    return false;
                }
                if(pagetype === "url" && !pageUrl){
                    errorAlert("Success page url can not be empty");
                    return false;
                }
                if(pagetype === "text" && !parsedContent){
                    errorAlert("Success page content can not be empty");
                    return false;
                }
            }

            if (!isChecked) {
                return false;
            }
            setLoading(true);
            const vars = updatedVarients(variants);
            if(vars.length > 0 ){
                setShopItem({ ...shopItem, price: vars[0].value });
            }

            const updatedShipping =  () =>{
                const arr = [];
                shipping.forEach((v, i) => {
                    if(v.country !== ''  && v.price !== "") { arr.push(v)}
                });
                if(wwsShipping > 0){  arr.push({country: "all", price: wwsShipping})}
                return arr
            }

            const ships = updatedShipping()
            if ( physical && ships.length < 1) {
                errorAlert("Please add at least one shipping method");
                return false;
            }
            if ( physical && vars.length < 1) {
                errorAlert("Please add at least one variant");
                return false;
            }

            const data = {
                ...shopItem,
                success_page_value:pagetype === "url" ? pageUrl:parsedContent,
                reward_file: rewardfile,
                category:checkboxes && checkboxes.length ? JSON.stringify(checkboxes):"",
                ask_question: question,
                slot_limitation: slots || "",
                special_member_price: spPrice || "",
                quantity_allow: haveQty ? 1 : 0,
                shipping : JSON.stringify(ships),
                shipping_info: shipping_info,
                varients : vars && vars.length ? JSON.stringify(vars) : "",
                vat_applicable: haveVat,
                image: thumb,
                ai_generated: IsAiImage ? 1 : 0,
                price : vars.length > 0 ? vars[0].value : shopItem.price,
                success_page_type: (item && item.success_page_type) || pagetype,
            };
            axios.post(`/shop/add`,data) .then((res) =>{
                if (res.data.status) {
                    resetUploader();
                    setOpen(false);
                    setTimeout(()=>{
                        successAlert(res.data.msg || "Item Added !!");
                        setOpen();
                    },[100]);
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
                ai_generated: IsAiImage ? 1 : 0,
            };
            axios
                .post(`/shop/update/${item.uuid}`, data)
                .then((res) => {
                    if (res.data.status) {
                        resetUploader();
                        setTimeout(()=>{
                            successAlert(res.data.msg || "Item Added !!");
                            setOpen();
                        },[100]);
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

        const AddItem = () => {
            return (
                <div className=" flex items-center">
                    <div className="p-1 rounded-lg bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                        <AiOutlineShop color="var(--pink)" size="1.5rem" />
                    </div>
                    <div className="ps-3 text-start">
                        <h2 className="text-md font-normal font-GillSans uppercase ">Sell Something</h2>
                        <p className="text-sm font-poppins">
                            Sell digital or physical items from your page
                        </p>
                    </div>
                </div>
            );
        };

        const addVariant = () => {
            setVariants([...variants, { name: '', value: '' }]);
        };
        const handleVariantChange = (index, field, value) => {
            const newVariants = variants.map((variant, i) =>
            i === index ? { ...variant, [field]: value } : variant
            );
            setVariants(newVariants);
        };
        const handleRemoveVariant = (index) => {
            const newVariants = variants.filter((_, i) => i !== index);
            setVariants(newVariants);
        };
        return (
            <Popup
            modalclass="addShopItem modal full"
            size="lg"
            action={open}
            text={title || <AddItem />}
            classes={`${classes ? classes : "px-3 py-2"}`} >
                <div className="p-3 md:p-8 overflow-auto bg-white md:bg-gray-200 h-full">
                    <div className="flex items-center justify-center py-3 bg-white sticky -top-4 w-full mb-6">
                        <h2 className="text-[22px]">What are you offering?</h2>
                    </div>
                    <div className="shop-forms-field p-0 md:p-8 max-w-[800px] m-auto rounded-[20px]">
                        <div className="shop-forms-field mb-4">
                            <label className="w-full mb-1.5"> Select what you’re offering </label>
                            <Select
                            defaultValue={product_type ? lists.filter((item) => item.value === product_type)  : { value: "Digital Products", label: "Digital Products" }}
                            classNamePrefix="react-select"
                            className="react-select-lists mb-4 mt-2 "
                            options={lists} onChange={handleLists}
                            placeholder={"Select what you’re offering.."}
                            />
                        </div>

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
                                placeholder="Describe what you’re selling ?"
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

                        <h2 className="text-md font-normal mb-3 mt-3">Item image</h2>
                        {isEdit ? <img alt="image-profile" className="w-full max-h-[500px] object-cover h-auto rounded-4" src={item && item.perma_link} /> : ""}
                        <div className={`uploader mb-4 mt-2 overflow-hidden`}>
                            <GlobalUploader
                                type="minimal"
                                ref={uploaderRef}
                                sendFile={getFileUID}
                                options={st.shop}
                            />
                            <div className={`${thumbEditable ? "":"d-none"} editable`}>
                                <UploadcareEditor
                                    setIsEditable={setIsThumbEditable}
                                    uuid={thumb}
                                    updateFile={imageEdited}
                                />
                            </div>
                        </div>

                        {physical ? (
                            <>
                            <h2 className="font-bold mb-1 pt-4 border-t border-gray-200">Options and Variants</h2>
                            <p className="text-gray-500 max-w-[600px] pb-2">Offer variations of your products with different options for size, color etc. The first option will be selected by default.</p>
                            <div className="add-form">
                                {variants.map((variant, index) => (
                                    <div className="flex items-center justify-between my-2">
                                        <input type="text" className="shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[12px] px-[20px] me-2" name={`variantName${index}`}
                                        placeholder="Variant Name"
                                        onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                                        />
                                        <div className="relative me-2">
                                         <span className="currency-tag">{defaultCurrency || 'GBP'}</span>
                                        <input
                                        type="text" className="shop-forms-input ps-[50px] bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[12px] px-[20px] "
                                        name={`variantValue${index}`}
                                        placeholder="Variant Price"
                                        onChange={(e) => handleVariantChange(index, 'value', e.target.value)}
                                        />
                                        </div>
                                        <button type="button" className="text-black shop-forms-input bg-gray-200 w-full bg-gray-300 text-[20px] border-0 rounded-xl p-[8px] px-[20px] max-w-[50px]" onClick={() => handleRemoveVariant(index)}> &times;</button>
                                    </div>
                                ))}
                                <button onClick={addVariant} className="button sm pinkbg px-3 py-2 mt-2 mb-3" >Add Variant</button>
                            </div>
                            <CountriesShipping handleShipping={handleShipping} handlewws={handlewws} />

                            <h2 className="font-bold pt-4 border-t border-gray-200 mb-2">Shipping Information</h2>
                            <input type="text" className="shop-forms-input bg-gray-200 w-full bg-gray-200 border-0
                            mb-6 rounded-xl p-[12px] px-[20px]"
                            name={`shipping-information`}
                            placeholder="Shipping information.."
                            onChange={(e) => setShipping_info(e.target.value)} />
                            </>
                        ) : (
                            <div className="shop-forms-field mb-4">
                                <label className="w-full mb-2">Success page * </label>
                                <div className="success-page-types flex items-center flex-wrap">
                                    <div className="flex items-center mb-2 pe-3">
                                        <input
                                            onChange={handleSuccessPageType}
                                            defaultChecked={item && item.success_page_type == "text" ? true:false}
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
                                            defaultValue={parsedContent}
                                            onChange={(e) =>
                                                setParsedContent(
                                                    e.target.value
                                                )
                                            }
                                            className="mt-2 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5"
                                            placeholder="Enter confirmation message here !!"
                                        ></textarea>
                                        <h2 className="text-md font-normal mb-3 mt-2"> Add the item for sale (Video,Images,Audio,or PDF) *</h2>
                                        <div
                                            className={`uploader mb-4 mt-2 overflow-hidden`}
                                        >
                                            {/* image */}
                                            {item && item.reward_file_type == "image" ? (
                                                <img
                                                    alt="image-profile"
                                                    className=" mb-4 w-full max-h-[500px] object-cover h-auto rounded-4"
                                                    src={
                                                        item &&
                                                        item.reward_file_url
                                                    }
                                                />
                                            ) : '' }

                                            {/* video */}
                                            {item && item.reward_file_type =="video" ?
                                                <video
                                                    controls
                                                    playsInline
                                                    className=" mb-4 w-full max-h-[500px] object-cover h-auto rounded-4"
                                                    src={
                                                        item &&
                                                        item.reward_file_url
                                                    }
                                                /> : ''
                                            }

                                            {/* audio */}
                                            {item && item.reward_file_type =="audio" ?
                                                    <audio
                                                        controls
                                                        playsInline
                                                        className=" mb-4 w-full object-cover h-[50px] rounded-4"
                                                        src={
                                                            item &&
                                                            item.reward_file_url
                                                        }
                                                    /> : ''
                                            }
                                            {/* video */}
                                            {item && item.reward_file_type =="application" ?
                                                <iframe
                                                    className=" mb-4 w-full  max-h-[500px] object-cover h-full rounded-4"
                                                    src={item &&item.reward_file_url}
                                                /> : ''
                                            }

                                            {IsAiImage ?
                                                <img
                                                alt="image-profile"
                                                className=" mb-2 mt-1 w-full max-h-[500px] object-cover h-auto rounded-4"
                                                src={IsAiImage} />
                                            : ""}
                                            <GlobalUploader
                                                type="minimal"
                                                ref={uploaderRef}
                                                sendFile={getRewardFile}
                                                options={st.shopreward}
                                            />
                                            <div className="flex justify-center" >
                                                <div>
                                                    <h2 className="text-center text-gray-400 py-3" >Or</h2>
                                                    <ImageGenerationWithAI update={getAIImage} />
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                ) : "" }
                                {pagetype == "url" ? (
                                    <input
                                        defaultValue={pageUrl}
                                        onChange={(e) =>setpageUrl(e.target.value)}
                                        className="mt-2 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-3 px-3.5"
                                        type="text" placeholder="https://"
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
                                        const filteritem = real_category && real_category.filter( (item) => item?.category.category == c?.category );
                                        const isCategory = filteritem && filteritem[0] ? true:null;
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
                                                <label htmlFor={`category-item-${c.uuid}`} className=" cursor-pointer text-md font-medium text-gray-900 ml-2 block" >{c.category}</label>
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
                                    {" "}
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
                                    ${haveVat == "1" ? "after:transition-all after:translate-x-full bg-blue-600":"bg-gray-200"}`}

                                ></div>
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Vat Applicable
                                    <button className="tooltipbtn">
                                        ?
                                        <p>
                                            Enable vat for this item of your
                                            chosen percentage.
                                        </p>
                                    </button>
                                </span>
                            </div>

                            <Popup
                                action={passClose}
                                space="4"
                                modalclassName="pinkmodal"
                            >
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
                                    ${haveQuestion ? "after:transition-all after:translate-x-full bg-blue-600":"bg-gray-200"}
                                    `}
                                ></div>
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Ask a question (optional)
                                    <button className="tooltipbtn">
                                        ?
                                        <p> If you'd like any additional information to fulfil this offering,you can leave a question here. </p>
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
                                    className={` cursor-pointer relative w-11 h-6  peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer     peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 ${haveSlots
                                    ? "after:transition-all after:translate-x-full  bg-blue-600"
                                    : "bg-gray-200"}`} ></div>
                                    <span className="ms-3 text-md font-medium text-gray-900">
                                    Limit slots (optional)
                                    <button className="tooltipbtn"> ?
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
                                    onChange={(e) => setSlots(e.target.value)} defaultValue={slots || ""}
                                    className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4" type="text"
                                />
                            ) : ""}
                        </div>

                        {shopItem && shopItem.type !== "physical" ? (
                            <>
                                <div className="ad-setting my-2">
                                    <div className="inline-flex items-centercursor-pointer">
                                        <div onClick={handleSpPrice}
                                        className={` cursor-pointer relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 ${haveSpPrice ? "after:transition-all after:translate-x-full bg-blue-600":"bg-gray-200 "}
                                        `}></div>
                                        <span className="ms-3 text-md font-medium text-gray-900">
                                            Special price for members (optional){" "}
                                            <button className="tooltipbtn">
                                                ?
                                                <p>
                                                    Offer a discounted extra
                                                    price to attract new members
                                                    and to keep your current
                                                    members engaged.
                                                </p>
                                            </button>
                                        </span>
                                    </div>
                                    {haveSpPrice ? (
                                        <input
                                            onChange={(e) =>
                                                setSpPrice(e.target.value)
                                            }
                                            className="mt-2 mb-3 shop-forms-input bg-gray-200 w-full bg-gray-200 border-0 rounded-xl p-[13px] px-4"
                                            type="text"
                                            defaultValue={spPrice || ""}
                                        />
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
                                <span className="ms-3 text-md font-medium text-gray-900">
                                    Allow buyer to choose a quantity (optional){" "}
                                    <button className="tooltipbtn">
                                        ?
                                        <p>
                                            Your supporters will be able to
                                            select the desired quantity of this
                                            item. You will receive payment based
                                            on the quantity They've chosen
                                            multiplied by your set price.
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
        {/*
        <button onClick={(e)=>setOpen(true)} className={classes ? classes : 'w-full shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[20px]'} >
            <h2 className='md:text-[19px]' >{title}</h2>
        </button>
        */}
        <AddForm classes="w-full shop-start-box px-6 py-6 md:px-8 md:py-12 text-center bg-white rounded-[20px]" />
        </>
    );
}
