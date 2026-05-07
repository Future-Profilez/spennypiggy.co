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
        value: "x_community ",
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
            modalclass="pinkmodal sendSurprize-modal shadow-pink membership-modal"
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
                <div className="membership-form-wrapper">
                    <div className="w-full">
                        <label className="block text-left mb-2 font-semibold">
                            Choose Membership Level
                        </label>
                        <ul className="membership-levels">
                            {memberships &&
                                memberships.map((m, i) => {
                                    return (
                                        <li
                                            key={`membership-${i}`}
                                            className="membership-level-item"
                                        >
                                            <input
                                                className="cursor-pointer hidden"
                                                type="radio"
                                                id={m.value}
                                                value={m.value}
                                                name="level"
                                                onChange={handleInput}
                                                checked={data.level === m.value}
                                            />
                                            <label
                                                className={`cursor-pointer capitalize px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                                    data &&
                                                    data.level == m.value
                                                        ? "active bg-purple-500 text-white"
                                                        : "bg-gray-200 text-black hover:bg-gray-300"
                                                }`}
                                                htmlFor={m.value}
                                            >
                                                {m.title}
                                            </label>
                                        </li>
                                    );
                                })}
                        </ul>
                    </div>

                    <div className="w-full">
                        <label className="block text-left mb-2 font-semibold">
                            {data && data.level === "lifetime"
                                ? "Lifetime membership price"
                                : "Monthly Price"}
                        </label>
                        <div className="relative currency-wrapper">
                            <span className="currency-tag absolute">GBP</span>
                            <input
                                className="border border-gray-300 rounded-2xl px-5 py-3 w-full min-h-[58px] focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-300 bg-white text-black"
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
                            <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">
                                        Fans pay:
                                    </span>
                                    <span className="font-bold text-gray-900">
                                        {new Intl.NumberFormat("en-GB", {
                                            style: "currency",
                                            currency: "GBP",
                                        }).format(
                                            calculateTotalSupporterPays(
                                                data.month_price,
                                                "GBP",
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
                                            currency: "GBP",
                                        }).format(data.month_price)}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 font-medium">
                                    Fans only see the total price to improve
                                    conversion
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
                        className="membership-update-btn"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                Processing...
                            </span>
                        ) : (
                            "Update Membership"
                        )}
                    </button>
                </div>
            </div>
        </Popup>
    );
}
