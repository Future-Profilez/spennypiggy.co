import { useAlerts } from "@/Components/Alerts";
import { usePage } from "@inertiajs/react";
import { route } from 'ziggy-js';
import axios from "axios";
import { useMemo } from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import st from "../../../css/uploader.module.css";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import GlobalUploader from "@/uploadcare/Uploader";
import Popup from "@/Components/Popup";
import { ShoppingBagIcon } from "@animateicons/react/lucide";
import PriceFormat from "@/includes/PriceFormat";
import { Link } from "@inertiajs/react";

const slug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
};

export default function AddItem(props) {
    const { auth, user } = usePage().props;
    const defaultCurrency = (user?.default_currency) || (auth?.user?.default_currency) || "GBP";

    const {
        item,
        update,
        title,
        pre_title,
        pre_description,
        pre_price,
        product_type,
        classes,
        type,
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
            (item && item.success_page_type) || "text",
        );
        const [parsedContent, setParsedContent] = useState(
            (item && item.success_page_value) || "",
        );
        const [pageUrl, setpageUrl] = useState(
            (item && item.success_page_value) || "",
        );

        const [step, setStep] = useState(1);
        const [physical, setPhysical] = useState(() => {
            if (isEdit) return item?.type === 'physical' ? 'physical' : 'Digital Products';
            return product_type === 'physical' ? 'physical' : 'Digital Products';
        });

        const [checkboxes, setCheckboxes] = useState([]);
        const [shopItem, setShopItem] = useState({
            type: isEdit ? item?.type : (product_type || "Digital Products"),
            name: item?.name || pre_title || "",
            description: item?.description || pre_description || "",
            price: item?.price || pre_price || "",
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
        const [shipping_info, setShipping_info] = useState(
            (item && item.shipping_information) || "",
        );

        const handleLists = (val) => {
            const type = val === 'physical' ? 'physical' : 'digital';
            setPhysical(type);
            setShopItem({ ...shopItem, type: type === 'physical' ? 'physical' : 'Digital Products' });
        };

        const nextStep = () => {
            if (step === 1) {
                if (!shopItem.name || !shopItem.description || !shopItem.price) {
                    errorAlert("Please fill in all required fields (Name, Description, Price)");
                    return;
                }
            }
            if (step === 2) {
                if (physical === 'physical') {
                    if (domesticShipping === "" && wwsShipping === "") {
                        errorAlert("Please add at least one shipping method");
                        return;
                    }
                    if (!String(shipping_info || "").trim()) {
                        errorAlert("Shipping information cannot be empty");
                        return;
                    }
                } else {
                    if (!pagetype) {
                        errorAlert("Please select a success page type");
                        return;
                    }
                    if (!rewardfile && pagetype === "text" && (!item || !item.reward_file_url)) {
                        errorAlert("Please add the item for sale (file)");
                        return;
                    }
                }
            }
            setStep(step + 1);
        };

        const prevStep = () => setStep(step - 1);

        useEffect(() => {
            const arr = real_category
                .map((element) => element?.uuid)
                .filter(Boolean);
            setCheckboxes(arr);
        }, [real_category]);

        const [isChecked, setIsChecked] = useState(false);
        const [adding, setAdding] = useState(false);
        const inputRef = useRef(null);
        const [loading, setLoading] = useState(false);

        const fetchAddedCategories = async () => {
            if (fetchingCats) return;
            setFetchingCats(true);
            try {
                const res = await axios.get(`/shop/user_shop_category/${auth.user.username || user.username}`);
                setCategories(res.data.categories);
            } catch (err) {
                console.error(err);
            } finally {
                setFetchingCats(false);
            }
        };

        useEffect(() => {
            fetchAddedCategories();
        }, []);

        const uploaderRef = useRef();
        const resetUploader = () => {
            if (uploaderRef.current) uploaderRef.current.reset();
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
            setrewardfile({
                uuid: file?.uuid,
                cdnUrlModifiers: file?.cdnUrlModifiers || null,
                url: file?.cdnUrl || file?.originalUrl
            });
        }

        const handleHaveQuestion = () => {
            setHaveQuestion(!haveQuestion);
            if (haveQuestion) setQuestion("");
        };

        const handleHaveSlots = () => {
            setHaveSlots(!haveSlots);
            if (haveSlots) setSlots("");
        };

        const handleSpPrice = () => {
            setHaveSpPrice(!haveSpPrice);
            if (haveSpPrice) setSpPrice("");
        };

        const handleQty = () => {
            setHaveQty(!haveQty);
        };

        const handleSuccessPageType = (val) => {
            setPageType(val);
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
            if (!value) return;
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

        const getSubmitData = () => {
            const ships = [];
            if (domesticShipping !== "" && Number(domesticShipping) >= 0) {
                ships.push({ country: auth?.user?.country_code || 'GB', price: domesticShipping });
            }
            if (wwsShipping !== "" && Number(wwsShipping) >= 0) {
                ships.push({ country: "all", price: wwsShipping });
            }

            return {
                ...shopItem,
                success_page_value: physical === 'physical' ? null : (pagetype === "url" ? pageUrl : parsedContent),
                reward_file: physical === 'physical' ? null : rewardfile,
                category: checkboxes && checkboxes.length ? JSON.stringify(checkboxes) : "",
                ask_question: question,
                slot_limitation: slots || "",
                special_member_price: spPrice || "",
                quantity_allow: haveQty ? 1 : 0,
                shipping: JSON.stringify(ships),
                shipping_profile_id: null,
                shipping_info: shipping_info,
                image: thumb,
                ai_generated: 0,
                price: shopItem.price,
                success_page_type: physical === 'physical' ? null : pagetype,
            };
        };

        const addShopItem = () => {
            setLoading(true);
            axios
                .post(`/shop/add`, getSubmitData())
                .then((res) => {
                    if (res.data.status) {
                        resetUploader();
                        setOpen(false);
                        window.dispatchEvent(new Event("closeAddOptions"));
                        window.dispatchEvent(new Event("shop:item-changed"));
                        setTimeout(() => {
                            successAlert(res.data.msg || "Item Added !!");
                        }, 100);
                        update && update();
                    } else {
                        errorAlert(res.data.msg || "Failed to add a shop item.");
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                    errorsHandling(err);
                });
        };

        const updateItem = () => {
            setLoading(true);
            axios
                .post(`/shop/update/${item.uuid}`, getSubmitData())
                .then((res) => {
                    if (res.data.status) {
                        resetUploader();
                        setOpen(false);
                        window.dispatchEvent(new Event("closeAddOptions"));
                        window.dispatchEvent(new Event("shop:item-changed"));
                        setTimeout(() => {
                            successAlert(res.data.msg || "Item Updated !!");
                        }, 100);
                        update && update();
                    } else {
                        errorAlert(res.data.msg || "Failed to update item.");
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    setLoading(false);
                    errorsHandling(err);
                });
        };

        const AddItemTrigger = () => {
            return (
                <div className=" flex items-center">
                    <div className="p-1 rounded-[30px]   bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px] min-w-[50px] min-h-[50px]">
                        <ShoppingBagIcon color="var(--pink)" size={24} />
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

        return (
            <Popup
                modalclass="addShopItems modals full"
                size="xl"
                action={open}
                text={title || <AddItemTrigger />}
                classes={`${classes ? classes : "px-3 py-2"}`}
            >
                <div className="overflow-hidden flex flex-col bg-white md:bg-gray-100 h-full">
                    {/* Header with Step Indicator */}
                    <div className="flex-shrink-0 bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
                        <div className="max-w-2xl mx-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {isEdit ? 'Edit Offering' : 'New Offering'}
                                </h2>
                                <div className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                    Step {step} of 3
                                </div>
                            </div>

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
                            
                            {/* Step Progress Bar */}
                            <div className="flex gap-2 h-1.5">
                                {[1, 2, 3].map((s) => (
                                    <div 
                                        key={s} 
                                        className={`flex-1 rounded-full transition-all duration-500 ${
                                            s <= step ? 'bg-pink-500 shadow-[0_0_8px_rgba(249,79,151,0.4)]' : 'bg-gray-200'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-2xl mx-auto bg-white mb-2">
                            
                            {/* STEP 1: BASIC INFO */}
                            {step === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">1. Select Product Type</h3>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => handleLists('digital')} 
                                                className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-[24px] border-[3px] transition-all active:scale-95 ${
                                                    physical !== 'physical' 
                                                    ? 'border-black bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                                    : 'border-gray-200 bg-gray-50 text-gray-400 grayscale'
                                                }`}
                                            >
                                                <span className="text-3xl">📁</span>
                                                <span className="font-black uppercase text-xs tracking-wider">Digital Item</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleLists('physical')} 
                                                className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-[24px] border-[3px] transition-all active:scale-95 ${
                                                    physical === 'physical' 
                                                    ? 'border-black bg-blue-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                                    : 'border-gray-200 bg-gray-50 text-gray-400 grayscale'
                                                }`}
                                            >
                                                <span className="text-3xl">📦</span>
                                                <span className="font-black uppercase text-xs tracking-wider">Physical Item</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">2. Visuals & Details</h3>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Thumbnail Image*</label>
                                            <div className="relative group">
                                                {isEdit && !thumb && (
                                                    <img
                                                        alt="Current thumbnail"
                                                        className="w-full border-[3px] border-black max-h-[240px] object-cover rounded-[24px] mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                        src={item?.perma_link}
                                                    />
                                                )}
                                                <div className="uploader overflow-hidden rounded-[24px] border-[3px] border-dashed border-gray-300 hover:border-[#FF007F] transition-colors bg-gray-50 p-4">
                                                    <GlobalUploader
                                                        ctxName="add-shop1-context"
                                                        type="minimal" 
                                                        ref={uploaderRef}
                                                        sendFile={getFileUID}
                                                        options={st.shop}
                                                    />
                                                </div>
                                                {thumbEditable && (
                                                    <div className="mt-4 border-[3px] border-black rounded-[24px] overflow-hidden">
                                                        <UploadcareEditor
                                                            setIsEditable={setIsThumbEditable}
                                                            uuid={thumb}
                                                            updateFile={imageEdited}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Product Name*</label>
                                                <input
                                                    name="name"
                                                    value={shopItem.name}
                                                    onChange={handelInputs}
                                                    className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 font-bold focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400"
                                                    type="text"
                                                    placeholder="What are you selling?"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Description*</label>
                                                <textarea
                                                    name="description"
                                                    rows="3"
                                                    value={shopItem.description}
                                                    onChange={handelInputs}
                                                    className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 font-bold focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400"
                                                    placeholder="Tell fans why they need this..."
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Price ({defaultCurrency})*</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{defaultCurrency}</div>
                                                    <input
                                                        name="price"
                                                        value={shopItem.price}
                                                        onChange={handelInputs}
                                                        className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 pl-14 font-black text-xl focus:ring-0 focus:bg-white transition-all"
                                                        type="number"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                
                                                {shopItem.price > 0 && (
                                                    <div className="p-4 bg-green-50 rounded-[20px] border-[3px] border-green-200 mt-4 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">You Receive</p>
                                                                <p className="text-xl font-black text-green-700">
                                                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: defaultCurrency }).format(shopItem.price)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fans Pay</p>
                                                                <p className="text-lg font-bold text-gray-600">
                                                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: defaultCurrency }).format(calculateTotalSupporterPays(shopItem.price, defaultCurrency).total_supporter_pays)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="mt-2 text-xs text-gray-500 font-medium">Fans only see the total price to improve conversion</p>
                                                            <p className="mt-1 text-xs text-gray-500 font-medium">Our fee is 19%. Uplift will show higher due to stripe / conversions to ensure you always receive 100% or slightly more.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: DELIVERY & CATEGORY */}
                            {step === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {physical === 'physical' ? (
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">1. Shipping Configuration</h3>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Domestic Rate*</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{defaultCurrency}</div>
                                                        <input 
                                                            type="number"
                                                            className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 pl-14 font-black focus:ring-0 focus:bg-white"
                                                            value={domesticShipping}
                                                            onChange={(e) => setDomesticShipping(e.target.value)}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Worldwide Rate*</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{defaultCurrency}</div>
                                                        <input 
                                                            type="number"
                                                            className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 pl-14 font-black focus:ring-0 focus:bg-white"
                                                            value={wwsShipping}
                                                            onChange={(e) => setwwsShipping(e.target.value)}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Important Shipping Notes*</label>
                                                <textarea
                                                    className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 font-bold focus:ring-0 focus:bg-white transition-all"
                                                    value={shipping_info}
                                                    rows="3"
                                                    placeholder="Estimated shipping time, restrictions, etc."
                                                    onChange={(e) => setShipping_info(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">1. Fulfillment Method</h3>
                                            
                                            <div className="flex gap-4">
                                                <button 
                                                    type="button"
                                                    onClick={() => setPageType('text')}
                                                    className={`flex-1 p-4 rounded-[20px] border-[3px] font-black uppercase text-xs tracking-widest transition-all ${
                                                        pagetype === 'text' ? 'border-black bg-pink-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-200 bg-gray-50'
                                                    }`}
                                                >
                                                    Message / File
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setPageType('url')}
                                                    className={`flex-1 p-4 rounded-[20px] border-[3px] font-black uppercase text-xs tracking-widest transition-all ${
                                                        pagetype === 'url' ? 'border-black bg-pink-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-200 bg-gray-50'
                                                    }`}
                                                >
                                                    External Link
                                                </button>
                                            </div>

                                            {pagetype === 'text' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Confirmation Message*</label>
                                                        <textarea
                                                            value={parsedContent}
                                                            rows="3"
                                                            onChange={(e) => setParsedContent(e.target.value)}
                                                            className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 font-bold focus:ring-0 focus:bg-white"
                                                            placeholder="Message to buyer after purchase..."
                                                        />
                                                    </div>
                                                    
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Delivery File (PDF, Audio, Video, Image)*</label>
                                                        <div className="uploader rounded-[24px] border-[3px] border-dashed border-gray-300 bg-gray-50 p-4">
                                                            <GlobalUploader
                                                                ctxName="add-shop2-context"
                                                                type="minimal"
                                                                ref={uploaderRef}
                                                                sendFile={getRewardFile}
                                                                options={st.shopreward}
                                                            />
                                                        </div>
                                                        {(item?.reward_file_url || rewardfile) && (
                                                            <div className="p-3 bg-blue-50 border-[3px] border-blue-200 rounded-[18px] flex items-center gap-2">
                                                                <span className="text-xl">📎</span>
                                                                <span className="text-xs font-black text-blue-700 uppercase tracking-wider">File attached successfully</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {pagetype === 'url' && (
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Redirect URL*</label>
                                                    <input
                                                        value={pageUrl}
                                                        onChange={(e) => setpageUrl(e.target.value)}
                                                        className="w-full bg-gray-100 border-[3px] border-black rounded-[20px] p-4 font-bold focus:ring-0 focus:bg-white"
                                                        type="text"
                                                        placeholder="https://your-content.com/..."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">2. Categories</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {categories?.map((c, i) => (
                                                <label 
                                                    key={c.uuid ?? i} 
                                                    className={`cursor-pointer px-4 py-2 rounded-full border-[3px] font-black uppercase text-[10px] tracking-widest transition-all ${
                                                        checkboxes.includes(c.uuid) ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-400'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        onChange={catValue}
                                                        checked={checkboxes.includes(c.uuid)}
                                                        value={c.uuid}
                                                    />
                                                    {c.category}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                ref={inputRef}
                                                className="flex-1 bg-gray-100 border-[3px] border-black rounded-[20px] p-3 font-bold text-sm focus:ring-0 focus:bg-white"
                                                type="text"
                                                placeholder="New category..."
                                            />
                                            <button
                                                onClick={addCategory}
                                                disabled={adding}
                                                className="px-6 py-3 bg-black text-white rounded-[20px] font-black uppercase text-[10px] tracking-widest active:scale-95 disabled:opacity-50"
                                            >
                                                {adding ? '...' : '+ Add'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: OPTIONS & TERMS */}
                            {step === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Final Settings</h3>
                                    
                                    <div className="space-y-6">
                                        {/* Toggle: Question */}
                                        <div className="p-5 rounded-[24px] border-[3px] border-black bg-gray-50 flex items-start gap-4">
                                            <input 
                                                type="checkbox" 
                                                id="ask_q"
                                                checked={haveQuestion}
                                                onChange={handleHaveQuestion}
                                                className="mt-1 w-6 h-6 rounded-lg border-[3px] border-black text-[#FF007F] focus:ring-0"
                                            />
                                            <div className="flex-1">
                                                <label htmlFor="ask_q" className="font-black uppercase text-xs tracking-wider block mb-1">Ask a question</label>
                                                <p className="text-[10px] font-bold text-gray-400 leading-tight">Require extra info from fans before purchase.</p>
                                                {haveQuestion && (
                                                    <input
                                                        value={question}
                                                        onChange={(e) => setQuestion(e.target.value)}
                                                        className="w-full bg-white border-[3px] border-black rounded-[18px] p-3 mt-3 font-bold text-sm"
                                                        placeholder="e.g. What is your Instagram handle?"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Toggle: Slots (Physical Only) */}
                                        {physical === 'physical' && (
                                            <div className="p-5 rounded-[24px] border-[3px] border-black bg-gray-50 flex items-start gap-4">
                                                <input 
                                                    type="checkbox" 
                                                    id="limit_s"
                                                    checked={haveSlots}
                                                    onChange={handleHaveSlots}
                                                    className="mt-1 w-6 h-6 rounded-lg border-[3px] border-black text-[#FF007F] focus:ring-0"
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor="limit_s" className="font-black uppercase text-xs tracking-wider block mb-1">Limit Quantity</label>
                                                    <p className="text-[10px] font-bold text-gray-400 leading-tight">Create urgency by limiting available stock.</p>
                                                    {haveSlots && (
                                                        <input
                                                            value={slots}
                                                            type="number"
                                                            onChange={(e) => setSlots(e.target.value)}
                                                            className="w-full bg-white border-[3px] border-black rounded-[18px] p-3 mt-3 font-black text-sm"
                                                            placeholder="Max items available"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Toggle: Member Price (Digital Only) */}
                                        {physical !== 'physical' && (
                                            <div className="hidden p-5 rounded-[24px] border-[3px] border-black bg-gray-50 flex items-start gap-4">
                                                <input 
                                                    type="checkbox" 
                                                    id="member_p"
                                                    checked={haveSpPrice}
                                                    onChange={handleSpPrice}
                                                    className="mt-1 w-6 h-6 rounded-lg border-[3px] border-black text-[#FF007F] focus:ring-0"
                                                />
                                                <div className="flex-1 ">
                                                    <label htmlFor="member_p" className="font-black uppercase text-xs tracking-wider block mb-1">Membership Discount</label>
                                                    <p className="text-[10px] font-bold text-gray-400 leading-tight">Reward your members with a special lower price.</p>
                                                    {haveSpPrice && (
                                                        <div className="mt-3 relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400 text-xs">{defaultCurrency}</div>
                                                            <input
                                                                value={spPrice}
                                                                type="number"
                                                                onChange={(e) => setSpPrice(e.target.value)}
                                                                className="w-full bg-white border-[3px] border-black rounded-[18px] p-3 pl-10 font-black text-sm"
                                                                placeholder="Special price"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Terms Checkbox */}
                                        <div className="isCheckedRefernce p-5 rounded-[24px] border-[3px] border-black bg-pink-50 flex items-start gap-4">
                                            <input
                                                id="agreeterm"
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => setIsChecked(e.target.checked)}
                                                className="mt-1 w-6 h-6 rounded-lg border-[3px] border-black text-[#FF007F] focus:ring-0 cursor-pointer"
                                            />
                                            <label htmlFor="agreeterm" className="text-[11px] font-bold text-gray-700 leading-relaxed cursor-pointer">
                                                I confirm I am 18+ and agree to the 
                                                <a href={route("terms-and-conditions")} target="_blank" className="text-[#FF007F] underline ml-1">Terms</a> & 
                                                <a href={route("terms-and-conditions")} target="_blank" className="text-[#FF007F] underline ml-1">Privacy Policy</a>.
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 sticky bottom-0 z-20">
                        <div className="max-w-2xl mx-auto flex gap-4">
                            {step > 1 && (
                                <button 
                                    onClick={prevStep}
                                    className="flex-1 py-4 border-[3px] border-black rounded-[20px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all bg-white"
                                >
                                    Back
                                </button>
                            )}
                            
                            {step < 3 ? (
                                <button 
                                    onClick={nextStep}
                                    className="flex-[2] py-4 bg-black text-white border-[3px] border-black rounded-[20px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button 
                                    onClick={isEdit ? updateItem : addShopItem}
                                    disabled={loading || !isChecked}
                                    className={`flex-[2] py-4 bg-pink-500 text-white border-[3px] border-black rounded-[20px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                                        (loading || !isChecked) ? 'opacity-50 grayscale cursor-not-allowed shadow-none translate-y-[2px] translate-x-[2px]' : ''
                                    }`}
                                >
                                    {loading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Publish Item')}
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
