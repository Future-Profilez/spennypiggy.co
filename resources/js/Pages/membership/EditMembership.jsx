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

const membershipBenifits = [
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
    const { auth } = usePage().props;
    const uploaderRef = useRef();
    const resetUploader = () => {
        if (uploaderRef.current) {
            uploaderRef.current.reset();
        }
    };
    const [close, setClose] = useState();
    const [rewardItems, setRewardItems] = useState(
        item?.rewards ? JSON.parse(item.rewards) : []
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

        router.post(`/membership/edit/${item.uuid}`,
            {
                ...data,
                thumbnail: thumb,
                rewards: rewardItems,
            }, {
            preserveScroll: true,
            onSuccess: (resp) => {
                // if(resp?.props?.flash?.success){
                //     successAlert(resp?.props?.flash?.success);
                // }
                // if(resp?.props?.flash?.error){
                //     errorAlert(resp?.props?.flash?.error);
                // }
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
                    }
                );
                setTimeout(() => setClose(), 100); // optional: this can be simplified
            },
            onError: (_err) => {
                console.error("error", _err);
                setLoading(false);
                errorAlert("Failed to update membership.Something went wrong.");
            },
        });

        // router.post(``, {
        //         ...data,
        //         thumbnail: thumb,
        //         rewards: rewardItems,
        //     })
        //     .then((resp) => {
        //         console.log(resp);
                // if (resp.data.status) {
                //     successAlert(resp.data.msg);
                //     setClose(false);
                //     setTimeout(() => setClose(), 100); // optional: this can be simplified
                //     reset();
                //     if (typeof resetUploader === "function") resetUploader();
                //     router.visit(
                //         route("user.show", {
                //             username: auth.user.username,
                //             page: "memberships",
                //         }),
                //         {
                //             preserveState: true,
                //             preserveScroll: true,
                //         }
                //     );
                // } else {
                //     if (resp.data.errors) {
                //         Object.entries(resp.data.errors).forEach(([_, value]) =>
                //             errorAlert(value)
                //         );
                //     } else {
                //         errorAlert(resp.data.msg);
                //     }
                // }
        //         setLoading(false);
        //     })
        //     .catch((err) => {
        //         console.error("err", err);
        //         errorAlert("Something went wrong. Please try again.");
        //         setLoading(false);
        //     });
    };

    return (
        <Popup
            modalclass="pinkmodal full sendSurprize-modal shadow-pink pl-0"
            space="4"
            size="md"
            action={close}
            classes={`btn-pink w-full sm mt-3`}
            text={`Edit`}
        >
            <div className="addgoal">
                <h2 className="uppercase font-GillSans pb-4 font-large">
                    Update Membership
                </h2>
                <div className="flex flex-wrap">
                    <div className="w-full mb-4">
                        <label className="block text-left mb-2">
                            Choose Membership Level
                        </label>
                        <ul className="pl-0 flex flex-wrap tiers">
                            {memberships &&
                                memberships.map((m, i) => {
                                    return (
                                        <li
                                            key={`membership-${i}`}
                                            className="mb-2 mr-2"
                                        >
                                            <input
                                                className="cursor-pointer hidden"
                                                type="checkbox"
                                                id={m.value}
                                                value={m.value}
                                                name="level"
                                                onChange={handleInput}
                                                checked={data.level === m.value}
                                            />
                                            <label
                                                className={`cursor-pointer capitalize ${
                                                    data &&
                                                    data.level == m.value
                                                        ? "active"
                                                        : ""
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

                    <div className="w-full mb-4">
                        <label className="block text-left mb-2">
                            {data && data.level === "lifetime"
                                ? "Lifetime membership price"
                                : "Monthly Price"}
                        </label>
                        <div className="relative  currency-wrapper">
                            <span className="currency-tag">{"GBP"}</span>
                            <input
                                        className="border-gray-300 border rounded-[30px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                        onChange={handleInput}
                                defaultValue={(item && item.price) || ""}
                                type="number"
                                name="month_price"
                                placeholder={
                                    data && data.level === "lifetime"
                                        ? "Enter Lifetime membership price"
                                        : "Enter monthly price.. "
                                }
                            />
                        </div>
                    </div>

                    <div className="w-full mb-4">
                        <label className="block text-left mb-1">
                            Thumbnail
                        </label>
                        <p className="text-gray-500 mb-3">
                            This is not required, but it can be a nice way to
                            build your brand or make the offering more
                            attractive.
                        </p>

                        <div
                            className={`${
                                !isEditable ? "" : "hidden"
                            } editable`}
                        >
                            <GlobalUploader ctxName='add-edit-membership-context'
                                type="minimal"
                                ref={uploaderRef}
                                sendFile={getFileUID}
                                options={st.membership}
                            />
                        </div>
                        <div
                            className={`${isEditable ? "" : "hidden"} editable`}
                        >
                            <UploadcareEditor
                                setIsEditable={setIsEditable}
                                uuid={thumb}
                                updateFile={imageEdited}
                            />
                        </div>
                    </div>

                    <p className="font-bold mb-3">Choose membership Rewards</p>
                    <div className="flex memberships-lists flex-wrap mb-4">
                        {membershipBenifits &&
                            membershipBenifits.map((m, i) => {
                                return (
                                    <div
                                        className="member-reward mr-2 mb-2 text-left"
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
                                                rewardItems.includes(m.value) ||
                                                false
                                            }
                                        />
                                        <label
                                            className="cursor-pointer capitalize"
                                            htmlFor={m.value}
                                        >
                                            {m.title}
                                        </label>
                                    </div>
                                );
                            })}
                    </div>

                    <button
                        onClick={updateMembership}
                        // disabled={loading}
                        className="flex w-full btn-pink lg mx-auto"
                    >
                        {loading ? "Processing" : "Update"}
                    </button>
                </div>
            </div>
        </Popup>
    );
}
