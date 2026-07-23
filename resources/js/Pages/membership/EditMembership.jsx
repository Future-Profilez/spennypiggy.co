import { useAlerts } from "@/Components/Alerts";
import { useEffect, lazy } from "react";
import LoaderButton from "@/Components/LoaderButton";
import { router, useForm, usePage } from "@inertiajs/react";
const Popup = lazy(() => import("@/Components/Popup"));
import { useState } from "react";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import axios from "axios";
import { useRef } from "react";
import UploadcareEditor from "@/uploadcare/UploadcareEditor";
import PriceFormat from "@/includes/PriceFormat";

const memberships = [
    {
        title: "Bronze Level",
        value: "bronze",
    },
    {
        title: "Silver Level",
        value: "silver",
    },
    {
        title: "Gold Level",
        value: "gold",
    },
    {
        title: "Platinum Level",
        value: "platinum",
    },
    {
        title: "Lifetime",
        value: "lifetime",
    },
];

const membershipBenefits = [
    {
        title: "Green Circle Insta",
        value: "green_circle_insta",
    },
    {
        title: "Insta Broadcast ",
        value: "insta_broadcast",
    },
    {
        title: "⁠Telegram Group",
        value: "telegram_group",
    },
    {
        title: " ⁠X Community ",
        value: "x_community",
    },
    {
        title: "⁠Monthly Content Bundle",
        value: "monthly_content_bundle",
    },
    {
        title: "Weekly Content Bundle",
        value: "weekly_content_bundle",
    },
    {
        title: "⁠Weekly DM chat",
        value: "weekly_DM_chat",
    },
    {
        title: "Monthly DM chat",
        value: "monthly_DM_chat",
    },
    {
        title: "Monthly Video call",
        value: "monthly_video_call",
    },
    {
        title: "Weekly Video call",
        value: "weekly_video_call",
    },
];

export default function EditMembership({ item }) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const { auth } = usePage().props;
    const defaultCurrency = (auth && auth.user && auth.user.default_currency) || "GBP";
    const uploaderRef = useRef();
    const resetUploader = () => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
    };
    const [close, setClose] = useState();
    const [rewardItems, setRewardItems] = useState(
        item?.rewards ? JSON.parse(item.rewards) : [],
    );
    const [thumb, setThumb] = useState(null);
    const [data, setData] = useState({
        level: "",
        month_price: "",
        rewards: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setData({
                level: item.level || "",
                month_price: item.price || "",
            });
        }
    }, [item]);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const [isEditable, setIsEditable] = useState(false);

    async function getFileUID(thumbs) {
        setThumb(thumbs.uuid || "");
        setIsEditable(true);
    }

    const imageEdited = async (d, uuid) => {
        const url = `${uuid}/${d.cdnUrlModifiers}-/preview/`;
        setIsEditable(false);
        setThumb(url);
    };

    const selectRewards = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            const s = [...rewardItems, value];
            setRewardItems(s);
        } else {
            const s = rewardItems.filter((item) => item !== value);
            setRewardItems(s);
        }
    };

    const updateMembership = (e) => {
        e.preventDefault();
        setLoading(true);

        router.post(
            `/membership/edit/${item.uuid}`,
            {
                ...data,
                thumbnail: thumb,
                rewards: rewardItems,
            },
            {
                preserveScroll: true,
                onSuccess: (resp) => {
                    setClose(false);
                    setLoading(false);
                    router.visit(
                        route("user.show", {
                            username: auth.user.username,
                            page: "memberships",
                        }),
                        {
                            preserveState: true,
                            preserveScroll: true,
                        },
                    );
                    setTimeout(() => setClose(), 100);
                },
                onError: (_err) => {
                    console.error("error", _err);
                    setLoading(false);
                    errorAlert(
                        "Failed to update membership.Something went wrong.",
                    );
                },
            },
        );
    };

    return (
        <Popup
            modalclass="pinkmodal sendSurprize-modal shadow-[4px_4px_0px_0px_#FF007F]ink membership-modal"
            space="4"
            size="xl"
            action={close}
            classes={`btn-pink w-full sm mt-3`}
            text={`Edit`}
        >
            <div className="membership-popup-content">
                <h2 className="uppercase font-GillSans pb-6 text-2xl font-bold text-left w-full">
                    Update Membership
                </h2>
                {item && item.is_suspended == 1 && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-left">
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
                <div className="membership-form-wrapper">
                    <div className="w-full">
                        <label className="block text-left mb-2 text-lg font-semibold text-gray-800">
                            Choose Membership Level
                        </label>
                        <p className="text-left text-sm text-gray-500 mb-4">Select the tier that best fits your membership offering.</p>
                        <div className="flex flex-col gap-4 mb-6">
                            {memberships &&
                                memberships.map((m, i) => {
                                    const isSelected = data?.level === m.value;
                                    const getTierIcon = (val) => {
                                        switch(val) {
                                            case 'bronze': return '🥉';
                                            case 'silver': return '🥈';
                                            case 'gold': return '🥇';
                                            case 'platinum': return '💎';
                                            case 'lifetime': return '👑';
                                            default: return '⭐';
                                        }
                                    };
                                    const getTierDescription = (val) => {
                                      switch(val) {
                                        case 'bronze': return 'A great starting point for your casual fans.';
                                        case 'silver': return 'Step it up with more exclusive perks.';
                                        case 'gold': return 'Premium access for your loyal supporters.';
                                        case 'platinum': return 'The ultimate VIP experience.';
                                        case 'lifetime': return 'One-time payment for endless access.';
                                        default: return 'Awesome membership tier.';
                                      }
                                    };
                                    return (
                                        <div
                                            key={`membership-${i}`}
                                            className="relative"
                                        >
                                            <input
                                                className="cursor-pointer hidden"
                                                type="radio"
                                                id={m.value}
                                                value={m.value}
                                                name="level"
                                                onChange={handleInput}
                                                checked={isSelected}
                                            />
                                            <label
                                                className={`cursor-pointer flex items-center p-3 rounded-[30px]  border-[3px] border-black transition-all duration-200 bg-white ${
                                                    isSelected
                                                        ? "shadow-[2px_2px_0px_0px_#ff4fa0] border-[#ff4fa0] translate-y-[2px]"
                                                        : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                }`}
                                                htmlFor={m.value}
                                            >
                                                <div className={`w-[50px] h-[50px] flex-shrink-0 rounded-[30px]  flex items-center justify-center text-2xl mr-4 ${isSelected ? 'bg-pink-100' : 'bg-[#ffe8f2]'}`}>
                                                    {getTierIcon(m.value)}
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className={`uppercase font-black text-lg leading-tight ${isSelected ? 'text-[#ff4fa0]' : 'text-black'}`}>
                                                        {m.title}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-600">
                                                        {getTierDescription(m.value)}
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="w-full">
                        <label className="block text-left mb-2 font-semibold">
                            {data && data.level === "lifetime"
                                ? "Lifetime membership price"
                                : "Monthly Price"}
                        </label>
                        <div className="relative currency-wrapper">
                            <span className="currency-tag absolute">{defaultCurrency}</span>
                            <input
                                className="border border-gray-300 rounded-[30px]  px-5 py-3 w-full min-h-[58px] focus:outline-none focus:border-[#FF007F] focus:ring-2 focus:ring-pink-300 bg-white text-black"
                                onChange={handleInput}
                                value={data.month_price || ""}
                                type="number"
                                min="1"
                                step="0.01"
                                name="month_price"
                                placeholder="Enter price"
                            />
                        </div>
                        {data.month_price > 0 && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-[30px]  border border-gray-200 shadow-sm w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">
                                        Fans pay:
                                    </span>
                                    <span className="font-bold text-gray-900">
                                        {new Intl.NumberFormat("en-GB", {
                                            style: "currency",
                                            currency: defaultCurrency,
                                        }).format(
                                            calculateTotalSupporterPays(
                                                data.month_price,
                                                defaultCurrency,
                                            ).total_supporter_pays,
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        You receive:
                                    </span>
                                    <span className="font-bold text-green-600">
                                        {new Intl.NumberFormat("en-GB", {
                                            style: "currency",
                                            currency: defaultCurrency,
                                        }).format(data.month_price)}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 font-medium">
                                    Fans only see the total price to improve
                                    conversion
                                </p>
                                <p className="mt-1 text-xs text-gray-500 font-medium">
                                    Our fee is 19%. Uplift will show higher due to stripe / conversions to ensure you always receive 100% or slightly more.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="w-full">
                        <label className="block text-left mb-2 font-semibold">
                            Thumbnail
                        </label>
                        <p className="membership-description">
                            This is not required, but it can be a nice way to
                            build your brand or make the offering more
                            attractive.
                        </p>

                        <div
                            className={`${
                                !isEditable ? "" : "hidden"
                            } editable w-full`}
                        >
                            <GlobalUploader
                                ctxName="add-edit-membership-context"
                                type="minimal"
                                ref={uploaderRef}
                                sendFile={getFileUID}
                                options={st.membership}
                            />
                        </div>
                        <div
                            className={`${isEditable ? "" : "hidden"} editable w-full`}
                        >
                            <UploadcareEditor
                                setIsEditable={setIsEditable}
                                uuid={thumb}
                                updateFile={imageEdited}
                            />
                        </div>
                    </div>

                    <div className="w-full">
                        <p className="font-bold text-lg mb-4 text-left">
                            Choose membership Rewards
                        </p>
                        <div className="membership-rewards-wrapper">
                            {membershipBenefits &&
                                membershipBenefits.map((m, i) => {
                                    return (
                                        <div
                                            className="member-reward"
                                            key={`reward-${i}`}
                                        >
                                            <input
                                                className="cursor-pointer hidden"
                                                type="checkbox"
                                                id={m.value}
                                                value={m.value}
                                                name="rewards"
                                                onChange={selectRewards}
                                                checked={
                                                    rewardItems.includes(
                                                        m.value,
                                                    ) || false
                                                }
                                            />
                                            <label
                                                className={`cursor-pointer capitalize px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                    rewardItems.includes(
                                                        m.value,
                                                    )
                                                        ? "bg-purple-500 text-white"
                                                        : "bg-gray-200 text-black hover:bg-gray-300"
                                                }`}
                                                htmlFor={m.value}
                                            >
                                                {m.title}
                                            </label>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    <button
                        onClick={updateMembership}
                        disabled={loading}
                        className="membership-update-btn flex items-center justify-center text-center uppercase"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                Processing...
                            </span>
                        ) : (
                            "UPDATE"
                        )}
                    </button>
                </div>
            </div>
        </Popup>
    );
}
