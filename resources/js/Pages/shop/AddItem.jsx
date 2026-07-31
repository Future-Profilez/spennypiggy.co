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
import RewardEditor, {
    rewardFromItem,
    rewardToPayload,
    validateReward,
} from "@/Components/Reward/RewardEditor";
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
    // The dashboard reads `?add=` once and hands it down. This component is lazy-loaded, so
    // parsing window.location here raced the dashboard's own history.replaceState and
    // usually lost — see the note in Dashboard.jsx.
    const addIntent = props.addIntent ?? null;
    const [open, setOpen] = useState(
        () => addIntent === "shop" || addIntent === "digital" || addIntent === "physical",
    );

    useEffect(() => {
        if (open) {
            document.documentElement.classList.add("overflow-hidden");
        } else {
            document.documentElement.classList.remove("overflow-hidden");
        }
    }, [open]);

        const { calculateTotalSupporterPays } = PriceFormat();
        const [categories, setCategories] = useState([]);
        const [fetchingCats, setFetchingCats] = useState(false);
        const real_category = useMemo(
            () => item?.real_category ?? [],
            [item?.real_category],
        );
        const [thumb, setThumb] = useState(null);
        const [thumbEditable, setIsThumbEditable] = useState(false);
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
        // One reward object replaces the old success_page_type / _value /
        // reward_file trio; the controller derives the legacy pair from it so
        // the order screens keep working.
        const [reward, setReward] = useState(() =>
            rewardFromItem(item, {
                file: "reward_file",
                mime: "reward_file_type",
                name: "reward_file_name",
                size: "reward_file_size",
            }),
        );

        const [step, setStep] = useState(1);
        const [physical, setPhysical] = useState(() => {
            if (isEdit) return item?.type === 'physical' ? 'physical' : 'Digital Products';
            if (addIntent === "physical") return "physical";
            if (addIntent === "shop" || addIntent === "digital") return "Digital Products";
            return product_type === 'physical' ? 'physical' : 'Digital Products';
        });

        const [checkboxes, setCheckboxes] = useState([]);
        const [shopItem, setShopItem] = useState({
            type: isEdit ? item?.type : (() => {
                if (addIntent === "physical") return "physical";
                if (addIntent === "shop" || addIntent === "digital") return "Digital Products";
                return product_type === 'physical' ? 'physical' : 'Digital Products';
            })(),
            name: item?.name || pre_title || "",
            description: item?.description || pre_description || "",
            price: item?.price || pre_price || "",
        });

        // Snapshot of the form's starting values — dirty-check baseline for the
        // discard confirmation (prefills/templates count as "clean").
        const initialSnapshotRef = useRef(
            JSON.stringify({
                n: item?.name || pre_title || "",
                d: item?.description || pre_description || "",
                p: item?.price || pre_price || "",
            }),
        );

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
                // Thumbnail is marked required in the UI but was never checked.
                //
                // ⚠️ Check `perma_link`, NOT `image`: the raw uuid column is in the Shop
                // model's $hidden list and never reaches the frontend, so `item.image`
                // is always undefined. Editing a listing that already had a thumbnail —
                // one the form was rendering right above this check — was refused with
                // "Please add a thumbnail image" and could not be saved at all.
                const existingThumb = item?.perma_link || item?.image_url || item?.image;

                if (!thumb && !(isEdit && existingThumb)) {
                    errorAlert("Please add a thumbnail image");
                    return;
                }
                // The £4.99–£10,000 rule was only enforced server-side, after 3 steps.
                const priceNum = parseFloat(shopItem.price);
                if (isNaN(priceNum) || priceNum < 4.99) {
                    errorAlert(`Price must be at least ${defaultCurrency} 4.99`);
                    return;
                }
                if (priceNum > 10000) {
                    errorAlert(`Price cannot exceed ${defaultCurrency} 10,000`);
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
                    const rewardProblem = validateReward(reward);
                    if (rewardProblem) {
                        errorAlert(rewardProblem);
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

        const [isChecked, setIsChecked] = useState(isEdit ? true : false);
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

        const thumbUploaderRef = useRef();
        const resetUploader = () => {
            thumbUploaderRef.current?.reset?.();
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

            const isDigital = physical !== 'physical';
            const rewardPayload = rewardToPayload(reward, {
                file: "reward_file",
                mime: "reward_file_type",
                name: "reward_file_name",
                size: "reward_file_size",
            });

            return {
                ...shopItem,
                // A physical product's deliverable is the parcel — it carries a
                // reward headline but no digital file, message or link.
                ...rewardPayload,
                reward_file: isDigital && reward.type === "file" ? reward.file?.uuid || null : null,
                reward_file_type: isDigital && reward.type === "file" ? reward.file?.mime || null : null,
                reward_body: isDigital ? rewardPayload.reward_body : "",
                reward_type: isDigital ? reward.type : null,
                // Physical: the parcel is the deliverable — self-fill the headline
                // from the product name so no reward validation can block the save.
                reward_title: isDigital
                    ? rewardPayload.reward_title
                    : rewardPayload.reward_title || shopItem.name,
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

        const trigger = (
                <div className=" flex items-center">
                    <div className="p-1 rounded-box-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-pink-100 flex items-center justify-center w-[44px] h-[44px] min-w-[44px] min-h-[44px] md:w-[52px] md:h-[52px] md:min-w-[52px] md:min-h-[52px]">
                        <ShoppingBagIcon color="var(--pink)" size={24} />
                    </div>
                    <div className="pl-3 text-left">
                        <h2 className="text-sm md:text-lg font-normal font-GillSans uppercase leading-tight">
                            Sell Something
                        </h2>
                        <p className="text-sm font-poppins">
                            Sell digital or physical items from your page
                        </p>
                    </div>
                </div>
        );

        // A half-finished 3-step product must not vanish on a stray tap of the
        // close button — confirm when the form is dirty.
        const isDirty = () =>
            step > 1 ||
            thumb !== null ||
            !!reward.file ||
            !!reward.title ||
            JSON.stringify({ n: shopItem.name, d: shopItem.description, p: shopItem.price })
                !== initialSnapshotRef.current;

        const confirmDiscard = () => {
            if (!isDirty()) return; // returning undefined lets the Popup close
            if (!window.confirm("Discard this product? Your changes haven't been saved.")) {
                return false; // veto the close
            }
        };

        return (
            <Popup
                modalclass="addShopItems modals full"
                size="xl"
                action={open}
                onHide={confirmDiscard}
                text={title || trigger}
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
                                <div className="mb-4 bg-red-50 border-2 border-red-500 p-4 rounded-box-sm">
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
                                            s <= step ? 'bg-[#FF007F] shadow-[0_0_8px_rgba(249,79,151,0.4)]' : 'bg-gray-200'
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
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">1. Select Product Type</h3>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => handleLists('digital')} 
                                                className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-box border-[3px] transition-all active:scale-95 ${
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
                                                className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-box border-[3px] transition-all active:scale-95 ${
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
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">2. Visuals & Details</h3>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Thumbnail Image*</label>
                                            <div className="relative group">
                                                {isEdit && !thumb && (
                                                    <img
                                                        alt="Current thumbnail"
                                                        className="w-full border-[3px] border-black max-h-[240px] object-cover rounded-box mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                        src={item?.perma_link}
                                                    />
                                                )}
                                                <div className="uploader overflow-hidden rounded-box border-[3px] border-dashed border-gray-300 hover:border-[#FF007F] transition-colors bg-gray-50 p-4">
                                                    <GlobalUploader
                                                        ctxName="add-shop1-context"
                                                        type="minimal" 
                                                        ref={thumbUploaderRef}
                                                        sendFile={getFileUID}
                                                        options={st.shop}
                                                    />
                                                </div>
                                                {thumbEditable && (
                                                    <div className="mt-4 border-[3px] border-black rounded-box overflow-hidden">
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
                                                    maxLength={80}
                                                    className="w-full bg-gray-100 border-[3px] border-black rounded-box-sm p-4 font-bold focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400"
                                                    type="text"
                                                    placeholder="What are you selling?"
                                                />
                                                <p className="text-[10px] text-gray-500 text-right">{(shopItem.name || "").length}/80</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Description*</label>
                                                <textarea
                                                    name="description"
                                                    rows="3"
                                                    value={shopItem.description}
                                                    onChange={handelInputs}
                                                    maxLength={500}
                                                    className="w-full bg-gray-100 border-[3px] border-black rounded-box-sm p-4 font-bold focus:ring-0 focus:bg-white transition-all placeholder:text-gray-400"
                                                    placeholder="Tell fans why they need this..."
                                                />
                                                <p className="text-[10px] text-gray-500 text-right">{(shopItem.description || "").length}/500</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Price ({defaultCurrency})*</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{defaultCurrency}</div>
                                                    <input
                                                        name="price"
                                                        value={shopItem.price}
                                                        onChange={handelInputs}
                                                        className="w-full bg-gray-100 border-[3px] border-black rounded-box-sm p-4 pl-14 font-black text-xl focus:ring-0 focus:bg-white transition-all"
                                                        type="number"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                
                                                {shopItem.price > 0 && (
                                                    <div className="p-4 bg-green-50 rounded-box-sm border-[3px] border-green-200 mt-4 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">You Receive</p>
                                                                <p className="text-xl font-black text-green-700">
                                                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: defaultCurrency }).format(shopItem.price)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Fans Pay</p>
                                                                <p className="text-lg font-bold text-gray-600">
                                                                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: defaultCurrency }).format(calculateTotalSupporterPays(shopItem.price, defaultCurrency).total_supporter_pays)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="mt-2 text-xs text-gray-500 font-medium">Fans only see the total price to improve conversion</p>
                                                            <p className="mt-1 text-xs text-gray-500 font-medium">Fees and currency conversion are added on top so you always receive the full price you set.</p>
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
                                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">1. Shipping Configuration</h3>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black uppercase tracking-widest text-gray-600 ml-1">Domestic Rate*</label>
                                                    <div className="relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400">{defaultCurrency}</div>
                                                        <input 
                                                            type="number"
                                                            className="w-full bg-gray-100 border-[3px] border-black rounded-box-sm p-4 pl-14 font-black focus:ring-0 focus:bg-white"
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
                                                            className="w-full bg-gray-100 border-[3px] border-black rounded-box-sm p-4 pl-14 font-black focus:ring-0 focus:bg-white"
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
                                                    className="w-full bg-gray-100 border-[3px] border-black rounded-box-sm p-4 font-bold focus:ring-0 focus:bg-white transition-all"
                                                    value={shipping_info}
                                                    rows="3"
                                                    placeholder="Estimated shipping time, restrictions, etc."
                                                    onChange={(e) => setShipping_info(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <RewardEditor
                                                value={reward}
                                                onChange={setReward}
                                                ctxName="add-shop2-context"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-6">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">2. Categories</h3>
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
                                                className="flex-1 bg-gray-100 border-[3px] border-black rounded-box-sm p-3 font-bold text-sm focus:ring-0 focus:bg-white"
                                                type="text"
                                                placeholder="New category..."
                                            />
                                            <button
                                                onClick={addCategory}
                                                disabled={adding}
                                                className="px-6 py-3 min-h-[44px] bg-black text-white rounded-box-sm font-black uppercase text-[10px] tracking-widest active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all disabled:opacity-50"
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
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
                                            Final settings
                                        </h3>
                                        <p className="mt-1 text-xs font-medium text-neutral-500">
                                            Optional. You can change these any time after publishing.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Each option is one card that expands
                                            when switched on — the earlier layout
                                            put a bare checkbox beside a label and
                                            an input that appeared out of nowhere. */}
                                        <OptionCard
                                            id="ask_q"
                                            title="Ask a question"
                                            hint="Require extra info from fans before purchase."
                                            checked={haveQuestion}
                                            onChange={handleHaveQuestion}
                                        >
                                            <input
                                                value={question}
                                                onChange={(e) => setQuestion(e.target.value)}
                                                className="w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white px-4 py-3 text-sm font-bold placeholder:font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_0px_rgba(255,0,127,1)]"
                                                placeholder="e.g. What name should I personalise it with?"
                                            />
                                        </OptionCard>

                                        {physical === 'physical' && (
                                            <OptionCard
                                                id="limit_s"
                                                title="Limit quantity"
                                                hint="Create urgency by limiting available stock."
                                                checked={haveSlots}
                                                onChange={handleHaveSlots}
                                            >
                                                <input
                                                    value={slots}
                                                    type="number"
                                                    inputMode="numeric"
                                                    min="1"
                                                    onChange={(e) => setSlots(e.target.value)}
                                                    className="w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white px-4 py-3 text-sm font-black placeholder:font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_0px_rgba(255,0,127,1)]"
                                                    placeholder="Max items available"
                                                />
                                            </OptionCard>
                                        )}

                                        {physical !== 'physical' && (
                                            <div className="hidden">
                                                <OptionCard
                                                    id="member_p"
                                                    title="Membership discount"
                                                    hint="Reward your members with a special lower price."
                                                    checked={haveSpPrice}
                                                    onChange={handleSpPrice}
                                                >
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">
                                                            {defaultCurrency}
                                                        </span>
                                                        <input
                                                            value={spPrice}
                                                            type="number"
                                                            inputMode="decimal"
                                                            onChange={(e) => setSpPrice(e.target.value)}
                                                            className="w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white py-3 pl-14 pr-4 text-sm font-black focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_0px_rgba(255,0,127,1)]"
                                                            placeholder="Special price"
                                                        />
                                                    </div>
                                                </OptionCard>
                                            </div>
                                        )}

                                        <label
                                            htmlFor="agreeterm"
                                            className={`isCheckedRefernce flex cursor-pointer items-start gap-3 rounded-box border-[3px] p-4 transition-colors ${
                                                isChecked
                                                    ? 'border-black bg-[#F2FBF5]'
                                                    : 'border-black bg-[#FFF0F6]'
                                            }`}
                                        >
                                            <input
                                                id="agreeterm"
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => setIsChecked(e.target.checked)}
                                                className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-box-sm border-[3px] border-black text-[#FF007F] focus:ring-0"
                                            />
                                            <span className="text-xs font-bold leading-relaxed text-neutral-700">
                                                I confirm I am 18+ and agree to the{' '}
                                                <a
                                                    href={route("terms-and-conditions")}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[#FF007F] underline"
                                                >
                                                    Terms
                                                </a>{' '}
                                                &{' '}
                                                <a
                                                    href={route("terms-and-conditions")}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[#FF007F] underline"
                                                >
                                                    Privacy Policy
                                                </a>
                                                .
                                            </span>
                                        </label>
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
                                    className="flex-1 py-4 min-h-[44px] border-[3px] border-black rounded-box-sm font-black uppercase text-xs tracking-widest active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all bg-white"
                                >
                                    Back
                                </button>
                            )}
                            
                            {step < 3 ? (
                                <button 
                                    onClick={nextStep}
                                    className="flex-[2] py-4 min-h-[44px] bg-black text-white border-[3px] border-black rounded-box-sm font-black uppercase text-xs tracking-widest active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF007F] focus-visible:ring-offset-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button 
                                    onClick={isEdit ? updateItem : addShopItem}
                                    disabled={loading || !isChecked}
                                    className={`flex-[2] py-4 min-h-[44px] bg-[#FF007F] text-white border-[3px] border-black rounded-box-sm font-black uppercase text-xs tracking-widest active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
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
}

/**
 * One optional setting: a switch, its explanation, and the field it controls —
 * which only appears once the switch is on, so an empty box never sits there
 * looking like something you forgot to fill in.
 */
function OptionCard({ id, title, hint, checked, onChange, children }) {
    return (
        <div
            className={`rounded-box border-[3px] border-black p-4 transition-colors ${
                checked ? "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "bg-[#F7F7F7]"
            }`}
        >
            <label htmlFor={id} className="flex min-h-[44px] cursor-pointer items-start gap-3">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={onChange}
                    className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer rounded-box-sm border-[3px] border-black text-[#FF007F] focus:ring-0"
                />
                <span className="min-w-0 flex-1 text-left">
                    <span className="block text-xs font-black uppercase tracking-wider">{title}</span>
                    <span className="mt-0.5 block text-xs font-medium leading-snug text-neutral-500">
                        {hint}
                    </span>
                </span>
            </label>
            {checked && <div className="mt-3">{children}</div>}
        </div>
    );
}
